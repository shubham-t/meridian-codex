import json
import tempfile
import unittest
from pathlib import Path
from harness import Harness, Store, authorize, contract_checks, available_tools
from providers import anthropic_messages


def call(name,args,ident='tool1'):
    return {'role':'assistant','content':'','tool_calls':[{'id':ident,'type':'function','function':{'name':name,'arguments':json.dumps(args)}}]}


class ScriptedModel:
    provider='test'; name='scripted'
    replies=[]
    def complete(self,system,messages,tools):
        return self.replies.pop(0), 1


class HarnessTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.h=Harness(Store(Path(self.tmp.name)/'test.db'),ScriptedModel)
        ScriptedModel.replies=[]
        self.s=self.h.new(6,'Sales')
        self.events=[]
        self.args={'customer':'Helix Manufacturing','recipient':'maya@helix.example','body':'Six-week pilot; pricing awaiting approval.'}
    def tearDown(self):
        self.tmp.cleanup()
    def test_contracts(self):
        self.assertTrue(all(c['passed'] for c in contract_checks(self.h)))
    def test_approval_pause_survives_restart(self):
        ScriptedModel.replies=[call('send_proposal',self.args),{'role':'assistant','content':'Recorded in local outbox.'}]
        self.h.run(self.s['id'],'Send this proposal',self.events.append)
        self.assertEqual(len(self.h.store.outbox(self.s['id'])),0)
        fresh=Harness(Store(self.h.store.path),ScriptedModel)
        resumed=fresh.get(self.s['id'])
        fresh.decide(resumed['id'],resumed['pending']['nonce'],True,self.events.append)
        self.assertEqual(len(fresh.store.outbox(resumed['id'])),1)
        with self.assertRaises(ValueError):
            fresh.decide(resumed['id'],'old',True,self.events.append)
    def test_rejection_never_writes(self):
        ScriptedModel.replies=[call('send_proposal',self.args),{'role':'assistant','content':'Rejected.'}]
        self.h.run(self.s['id'],'Send',self.events.append)
        self.h.decide(self.s['id'],self.s['pending']['nonce'],False,self.events.append)
        self.assertEqual(self.h.store.outbox(self.s['id']),[])
    def test_unavailable_tool_is_denied_at_execution(self):
        with self.assertRaises(PermissionError):
            self.h.execute(self.s,self.events.append,'revenue_summary',{},'x')
        names=[t['function']['name'] for t in available_tools(6,'Sales')]
        self.assertNotIn('revenue_summary',names)
    def test_injected_approval_parameter_rejected(self):
        with self.assertRaises(ValueError):
            self.h.execute(self.s,self.events.append,'send_proposal',self.args|{'approved':True},'x')
    def test_artifact_path_and_task_isolation(self):
        with self.assertRaises(ValueError):
            self.h.execute(self.s,self.events.append,'save_artifact',{'name':'../.env','content':'x'},'x')
        self.h.execute(self.s,self.events.append,'save_artifact',{'name':'proposal.md','content':'x'},'x')
        other=self.h.new(6)
        self.assertEqual(self.h.store.artifacts(other['id']),[])
    def test_reviewer_uses_shared_call_budget(self):
        self.s['turn_calls']=int(__import__('providers').config().get('MAX_MODEL_CALLS',10))
        with self.assertRaises(__import__('providers').ProviderError):
            self.h.review_proposal(self.s,self.events.append,{'customer':'Helix Manufacturing','draft':'x'})
    def test_compaction_keeps_original_history(self):
        self.s['messages']=[{'role':'user','content':'Remember CRM-1042'},{'role':'assistant','content':'Saved.'}]
        ScriptedModel.replies=[{'role':'assistant','content':'Remember CRM-1042'}]
        self.h.compact(self.s['id'],self.events.append)
        restored=self.h.store.restore(self.s['id'])
        self.assertEqual(len(restored['archive'][0]),2)
        self.assertEqual(restored['summary'],'Remember CRM-1042')
    def test_anthropic_preserves_signed_blocks(self):
        blocks=[{'type':'thinking','thinking':'','signature':'opaque'}, {'type':'tool_use','id':'x','name':'customer_lookup','input':{'name':'Helix Manufacturing'}}]
        history=[{'role':'user','content':'lookup'},{'role':'assistant','content':'','_anthropic_content':blocks},
                 {'role':'tool','tool_call_id':'x','content':'{}'}]
        out=anthropic_messages(history)
        self.assertEqual(out[1]['content'],blocks)
        self.assertEqual(out[2]['content'][0]['tool_use_id'],'x')
    def test_baseline_has_no_tools_or_context(self):
        s=self.h.new(0)
        self.assertEqual(available_tools(0,'Sales'),[])
        self.assertNotIn('Meridian Systems',self.h.system(s))


if __name__=='__main__':
    unittest.main(verbosity=2)
