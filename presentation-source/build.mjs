import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out=path.join(base,'work/presentation');
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#0A1115',ink:'#EAF1EF',muted:'#9AB1B7',mint:'#80E6C2',amber:'#F4BB77',blue:'#8EC8EF',purple:'#B5A4ED'};
let number=0;
function text(s,value,x,y,w,h,size=28,color=C.ink,bold=false,font='Arial'){
 const sh=s.shapes.add({name:'text-'+s.shapes.items.length,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=value;sh.text.style={fontSize:size,color,bold,typeface:font,insets:0,autoFit:'none',verticalAlignment:'top',wrap:'square'};return sh;
}
function slide(title,notes='',opts={}){const s=p.slides.add();s.background.fill=opts.light?'#EDF2EE':C.bg;number++;s.speakerNotes.text=notes;
 if(title)text(s,title,64,55,1152,100,46,opts.light?'#133B2B':C.ink,false);
 text(s,String(number).padStart(2,'0'),1162,665,54,24,16,opts.light?'#6C8877':'#56727C');
 return s;
}
function col(s,title,body,x,y,w,color=C.mint){text(s,title,x,y,w,58,32,color);text(s,body,x,y+74,w,220,26,C.muted);}
function note(t,src=''){return t+(src?'\n\nSources:\n'+src:'');}
const video='https://www.youtube.com/watch?v=mv9kfF_kJd0';
const claude='https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works';
const lc='https://docs.langchain.com/oss/python/langgraph/persistence';
const cover=await fs.readFile(path.join(base,'session-assets/harness-cover.png'));
function coverImage(s){s.images.add({blob:cover.buffer.slice(cover.byteOffset,cover.byteOffset+cover.byteLength),contentType:'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover',alt:'Illustrative glass core inside a surrounding support structure'});}
// 01
{
 const s=slide('',note('0:00–0:30. Introduce the question: what turns a capable model into a useful workplace agent? Explain that all company data is synthetic. This session is inspired by the staged harness walkthrough, with an explicit evaluation stage added.',video));coverImage(s);
 text(s,'AGENT\nHARNESSES',64,196,655,210,82,C.ink,true);text(s,'A model. A workflow.\nA system you can inspect.',68,440,540,90,30,C.mint);text(s,'MERIDIAN SYSTEMS  /  45-MINUTE WORKSHOP',68,626,700,30,16,C.muted);
}
// 02
{
 const s=slide('Today’s session',note('0:30–1:00. Set expectations. We will explain the concepts first, build the demo in eight stages, then discuss where to apply this at work. The audience can follow the business outcome without reading every line of code.'));
 [[64,'12','Concepts','What the harness owns'],[474,'25','Live build','Code, scenario, evidence'],[884,'08','Discussion','Choices for your organization']].forEach(([x,n,t,b])=>{text(s,n,x,220,300,130,100,C.mint);text(s,'MINUTES',x,345,300,30,16,C.muted);text(s,t,x,412,320,50,34);text(s,b,x,475,310,82,24,C.muted);});
}
// 03
{
 const s=slide('A chatbot returns an answer',note('1:00–2:00. Read the request aloud. Ask: does the model know the customer, approved pricing, or where to save the draft? The model may ask for information or produce generic prose. Do not imply that every model will hallucinate. The limitation is missing access and workflow, not necessarily poor reasoning.'));
 text(s,'“Prepare a rollout proposal\nfor Helix Manufacturing.”',64,190,1120,170,54,C.mint);
 text(s,'Missing customer facts',64,430,340,45,28);text(s,'No tool execution',474,430,340,45,28);text(s,'No saved task state',884,430,330,45,28);
 text(s,'A useful answer can still leave the employee doing the work.',64,535,1100,80,30,C.muted);
}
// 04
{
 const s=slide('An agent works through a task',note('2:00–3:00. Describe the loop. The model selects the next action. The application validates and executes it, returns the result, and decides whether another model call is permitted. The model does not execute arbitrary Python merely by naming a tool.',claude));
 const rows=[['01','Decide','The model proposes the next action'],['02','Act','The harness validates and executes a tool'],['03','Observe','The model receives the actual result'],['04','Continue or stop','The loop checks completion and limits']];
 rows.forEach((r,i)=>{const y=196+i*103;text(s,r[0],64,y,80,50,30,C.mint);text(s,r[1],180,y,300,50,32);text(s,r[2],525,y,680,60,26,C.muted);});
}
// 05
{
 const s=slide('The harness is the execution layer',note('3:00–4:00. Define harness as the software around the model that assembles context, executes tools, enforces boundaries and preserves state. The term is useful, but many of these responsibilities are familiar software engineering. Evaluation spans every layer.',video+'\nhttps://www.langchain.com/oss-overview'));
 text(s,'MODEL',64,210,390,90,65,C.ink,true);text(s,'+',475,210,90,90,65,C.muted);text(s,'HARNESS',590,210,610,90,65,C.mint,true);
 text(s,'Reasoning and generation',64,320,430,70,26,C.muted);text(s,'Context, tools, controls and state',590,320,610,70,26,C.muted);
 text(s,'The application decides what can happen.',64,505,1130,75,40,C.ink);
}
// 06
{
 const s=slide('Context and skills',note('4:00–5:00. Company context contains stable guidance. Customer records belong in retrieval tools because they change. A skill is a reusable task procedure; it is not training and not an access-control mechanism. In this demo the skill is loaded explicitly at stage 2 for teaching clarity. Larger systems may select skills on demand.'));
 col(s,'Context','What the company does\nWorking conventions\nRelevant records',64,205,520,C.blue);
 col(s,'Skills','How to prepare a proposal\nRequired sections\nChecks before a commitment',704,205,510,C.purple);
 text(s,'Instructions guide behavior. Code enforces permissions.',64,545,1120,70,30,C.muted);
}
// 07
{
 const s=slide('Tools and the agent loop',note('5:00–6:00. This simplified loop illustrates the structure. The demo’s Reveal code panel reads the actual source function, including checkpoint and approval behavior. A tool description is an interface to code, not the implementation. Call budgets include the reviewer.',claude));
 text(s,'while budget.remaining:\n    response = model(context, tools)\n    if response.is_final:\n        return response.text\n    result = execute(response.tool_call)\n    context.append(result)',64,205,1152,280,30,C.mint,false,'Consolas');
 text(s,'Simplified pseudocode. Each tool result becomes evidence for the next step.',64,550,1100,70,26,C.muted);
}
// 08
{
 const s=slide('Permissions and approvals',note('6:00–7:00. Permissions answer who may invoke a capability. Approval answers whether a specific allowed action should happen now. The backend checks both, regardless of what the model says. We will inspect the recipient and exact content before approving a local outbox write. The profile selector is a teaching device, not production authentication.'));
 col(s,'Permission','Can this role use this tool?\n\nEngineering cannot invoke\nrevenue_summary.',64,205,520,C.mint);
 col(s,'Approval','May this exact action proceed?\n\nSales must approve a proposal\nbefore the outbox write.',704,205,510,C.amber);
 text(s,'A refusal in chat is not proof of authorization enforcement.',64,555,1120,70,28,C.muted);
}
// 09
{
 const s=slide('Persistence and context management',note('7:00–8:00. Distinguish state, artifacts and context. A checkpoint restores the conversation and pending action state. A saved proposal is an artifact. Summarization controls the context sent to the model and is lossy. In this demo compaction is explicit so the audience can inspect it. Restoring task state does not undo an outbox write.',lc));
 [['Checkpoint','Where the task stopped',C.blue],['Artifact','What the task produced',C.mint],['Summary','What the next call needs',C.purple]].forEach((r,i)=>{const y=205+i*128;text(s,r[0],64,y,400,54,36,r[2]);text(s,r[1],550,y+4,640,65,30,C.muted);});
}
// 10
{
 const s=slide('Evaluation and observability',note('8:00–9:00. The execution trace shows actions, inputs, outputs, failures and token usage. It does not expose hidden reasoning. Separate deterministic contract tests from probabilistic model evaluation. The included live check tests only lookup, citation and approval wording, not factual correctness in general. Broader evaluation should cover a representative set and repeated runs.'));
 text(s,'TRACE',64,200,480,70,55,C.mint,true);text(s,'What happened?',64,294,500,55,32);text(s,'Tool arguments and results\nApproval decisions\nCalls, tokens and failures',64,375,500,170,27,C.muted);
 text(s,'EVALUATE',704,200,510,70,55,C.amber,true);text(s,'Did it meet the requirement?',704,294,510,80,32);text(s,'Task success and grounding\nBoundary violations\nLatency and cost',704,405,510,170,27,C.muted);
}
// 11
{
 const s=slide('Meet Meridian Systems',note('9:00–10:00. Introduce our fictional company, its operations analytics product, and the customer. The conflicting request makes review meaningful: Helix requested a two-week pilot and a discount, but the record confirms a six-week pilot subject to review, EU residency and no approved discount. All figures and names are synthetic.'));
 text(s,'One customer.\nOne proposal.\nEight stages.',64,200,550,260,59,C.mint);
 text(s,'HELIX MANUFACTURING',704,204,500,35,18,C.muted);
 text(s,'120 pilot users\nEU data residency\n6-week pilot, subject to review\nPricing awaiting approval',704,268,500,245,29,C.ink);
 text(s,'Synthetic customer record CRM-1042',704,560,500,40,20,C.muted);
}
// 12
{
 const s=slide('',note('10:00–12:00. Open the demo. Click Focus demo and optionally fullscreen. At each stage: reveal the actual code, explain the new responsibility, close the code, run the suggested prompt, inspect the evidence. Use the presenter runbook for the 25-minute path. Do not narrate every line. Before starting, test the model connection. The same configured model remains in use at every stage.'));coverImage(s);
 text(s,'LIVE BUILD',64,150,630,105,77,C.ink,true);text(s,'Reveal the code\nRun the scenario\nInspect the evidence',68,294,590,205,37,C.mint);const a=text(s,'Open Meridian Harness Lab',68,570,575,55,28,C.ink);a.text.get('Open Meridian Harness Lab').link={uri:'http://127.0.0.1:8765',isExternal:true};text(s,'The local Python server must be running.',68,625,550,35,17,C.muted);
}
// 13
{
 const s=slide('What changed during the demo',note('37:00–38:00. Return from the live demo. Ask the audience which capability changed the business outcome most. Avoid treating every component as mandatory for every use case. The baseline model remained the same; its environment and execution rules changed.'));
 const rows=[['Knowledge','Company context and reusable procedures'],['Action','Verified records and executable tools'],['Control','Role checks and exact-action approval'],['Continuity','Artifacts, checkpoints and summaries']];
 rows.forEach((r,i)=>{const y=205+i*105;text(s,r[0],64,y,340,55,32,[C.blue,C.mint,C.amber,C.purple][i]);text(s,r[1],445,y,760,65,28,C.muted);});
}
// 14
{
 const s=slide('The deployment boundary',note('38:00–39:00. This is a teaching application. There is real model inference and real local execution, but there is no authenticated multi-user identity, tenant isolation, queue service, external email delivery or production reliability claim. Use production identity, least-privilege credentials, robust storage and representative evals before connecting real systems.'));
 col(s,'This workshop','Local Python service\nSynthetic records\nRole selector for demonstration\nLocal outbox and SQLite',64,205,520,C.mint);
 col(s,'A production deployment','Authenticated user identity\nScoped company integrations\nDurable jobs and audit controls\nRepresentative evaluations',704,205,510,C.amber);
}
// 15
{
 const s=slide('A useful first pilot',note('39:00–40:00. Invite a narrow workflow rather than a general assistant for every team. Choose one repetitive task with verifiable data and a human owner. Define a measurable outcome before expanding tools or autonomy. Start with draft-only or read-only behavior and add consequential actions when the controls and evaluations justify them.'));
 text(s,'One workflow',64,205,1110,75,52,C.mint);text(s,'One accountable owner',64,320,1110,75,52,C.ink);text(s,'A clear definition of success',64,435,1110,80,52,C.ink);
 text(s,'The next component should solve an observed failure.',64,585,1120,55,26,C.muted);
}
// 16
{
 const s=slide('Discussion',note('40:00–45:00. Use these prompts for a mixed audience. Engineers can discuss where enforcement belongs; managers can identify workflow ownership and acceptable outcomes. If time is short, focus on which action must require approval and how success will be measured.'));
 text(s,'Which workflow would benefit first?',64,215,1120,75,42,C.mint);text(s,'Which actions need human approval?',64,345,1120,75,42,C.ink);text(s,'What evidence would justify expanding it?',64,475,1120,100,42,C.ink);
}
// 17 appendix
{
 const s=slide('Provider configuration',note('Appendix. The app uses a native Anthropic adapter for current testing and a Chat Completions adapter for the internal gateway. Keep API credentials in the local .env file. Do not put keys in a browser or slide. Start a new task when changing providers or models. Use SSL_CERT_FILE for a company CA; do not disable TLS verification.','https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create\nhttps://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide'));s.hidden=true;
 text(s,'Current live tests',64,190,520,50,30,C.mint);text(s,'PROVIDER=anthropic\nMODEL=claude-sonnet-5-5',64,275,530,180,25,C.ink,false,'Consolas');
 text(s,'Organization laptop',704,190,510,50,30,C.blue);text(s,'PROVIDER=openai-compatible\nMODEL=internal-model-id\nOPENAI_BASE_URL=…/v1',704,275,510,180,25,C.ink,false,'Consolas');text(s,'Same harness, data and UI. Different provider adapter.',64,555,1120,65,29,C.muted);
}
// 18 appendix
{
 const s=slide('Sources and implementation',note('Appendix reference slide. Inspiration is credited to Aish Reganti. The workshop implementation is an original, framework-light Python harness, not a reproduction of the Deep Agents code. API behavior was checked against official documentation. The cover artwork is an AI-generated conceptual illustration.',video+'\n'+claude+'\n'+lc+'\nhttps://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create'));s.hidden=true;
 text(s,'Inspiration',64,200,330,45,27,C.mint);text(s,'Aish Reganti’s staged harness walkthrough',450,200,750,70,28,C.ink);
 text(s,'API contracts',64,320,330,45,27,C.mint);text(s,'Anthropic Messages API\nOpenAI-compatible Chat Completions',450,320,750,90,28,C.ink);
 text(s,'Project materials',64,470,330,45,27,C.mint);text(s,'Runnable Python source, tests, presenter runbook\nand local configuration guide',450,470,750,110,28,C.ink);
}
await fs.mkdir(path.join(out,'renders'),{recursive:true});
await (await PresentationFile.exportPptx(p)).save(path.join(out,'draft.pptx'));
for(let i=0;i<p.slides.items.length;i++){
 const s=p.slides.items[i];const img=await p.export({slide:s,format:'png',scale:1});
 await fs.writeFile(path.join(out,'renders',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await img.arrayBuffer()));
}
console.log('Created 18 editable slides and PNG previews');
