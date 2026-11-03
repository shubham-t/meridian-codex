"""Protocol contract tests; these do not claim a live internal gateway test."""
import io
import json
import unittest
from unittest.mock import patch
from providers import Model, ProviderError


class ProviderTests(unittest.TestCase):
    def test_openai_tool_roundtrip_and_gateway_configuration(self):
        cfg = {'PROVIDER':'openai-compatible','MODEL':'internal-test',
               'OPENAI_API_KEY':'dummy-test-key','CHAT_COMPLETIONS_URL':'https://gateway.example/infer',
               'AUTH_HEADER':'X-API-Key','AUTH_PREFIX':'','MAX_TOKENS_FIELD':'max_completion_tokens'}
        call = {'id':'call-1','type':'function','function':{'name':'customer_lookup','arguments':'{"name":"Helix"}'}}
        schema = {'type':'function','function':{'name':'customer_lookup','description':'lookup',
                  'parameters':{'type':'object','properties':{'name':{'type':'string'}},'required':['name']}}}
        history = [{'role':'user','content':'Lookup Helix'},
                   {'role':'assistant','content':'','tool_calls':[call],'_anthropic_content':[{'type':'thinking'}]},
                   {'role':'tool','tool_call_id':'call-1','content':'{"record_id":"CRM-1042"}'}]
        reply = {'choices':[{'message':{'content':None,'tool_calls':[call]},'finish_reason':'tool_calls'}],
                 'usage':{'total_tokens':42}}
        with patch('providers.config',return_value=cfg), patch('providers.urllib.request.urlopen',return_value=io.BytesIO(json.dumps(reply).encode())) as transport:
            answer,tokens = Model().complete('System policy',history,[schema])
        request = transport.call_args.args[0]
        payload = json.loads(request.data)
        self.assertEqual(request.full_url,'https://gateway.example/infer')
        self.assertEqual(request.get_header('X-api-key'),'dummy-test-key')
        self.assertEqual(payload['messages'][0],{'role':'system','content':'System policy'})
        self.assertNotIn('_anthropic_content',payload['messages'][2])
        self.assertEqual(payload['messages'][3]['tool_call_id'],'call-1')
        self.assertEqual(payload['tools'],[schema])
        self.assertEqual(payload['max_completion_tokens'],1800)
        self.assertNotIn('max_tokens',payload)
        self.assertEqual(answer['tool_calls'],[call])
        self.assertEqual(tokens,42)

    def test_missing_choices_is_explicit_failure(self):
        cfg={'PROVIDER':'openai-compatible','MODEL':'test','OPENAI_API_KEY':'dummy',
             'OPENAI_BASE_URL':'https://gateway.example/v1'}
        with patch('providers.config',return_value=cfg), patch('providers.urllib.request.urlopen',return_value=io.BytesIO(b'{}')):
            with self.assertRaisesRegex(ProviderError,'choices array'):
                Model().complete('system',[{'role':'user','content':'test'}],[])


if __name__ == '__main__':
    unittest.main(verbosity=2)
