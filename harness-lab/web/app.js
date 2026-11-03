'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let boot, task, stage=0, busy=false, traceEvents=[], toastTimer;
const colors=['#80e6c2','#8ec8ef','#b5a4ed','#80e6c2','#dbb8ed','#f4bb77','#91c7f4','#c7dc91'];
const notes=[
 '0–2 min. Ask the audience what information the model is missing. Keep this first response visible, then add one capability at a time.',
 '2–4 min. Explain that company.md is instructions and context, not model training. Ask which facts belong here and which should be retrieved.',
 '4–6 min. Show the five-section proposal procedure. A skill makes a process reusable, but instructions alone do not guarantee compliance.',
 '6–10 min. Open a customer_lookup event. The model selected the tool and Python executed it. Show the source record ID. Call limits bound the loop.',
 '10–13 min. The deliberately flawed proposal is a useful test: a 2-week launch, 20% discount and US hosting contradict CRM-1042. The reviewer has isolated context and no write tools.',
 '13–18 min. Inspect the complete pending payload. Reject it once, then request a new send and approve. Change to Engineering and ask for revenue. Tool authorization is enforced by Python, not a prompt.',
 '18–22 min. Save an artifact, start another task, then restore this one from Saved tasks. Reload the browser. Compact only after showing what can be lost in a summary.',
 '22–25 min. Run the five contract tests. Then run the live grounding smoke test. Explain why one passing output does not prove reliability. Ask what your organization should measure.'
];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function md(text){
 let s=esc(text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
 return s.split(/\n\n+/).map(p=>{
   if(/^#{1,4} /.test(p)) return p.split('\n').map(l=>/^#{1,4} /.test(l)?'<h4>'+l.replace(/^#{1,4} /,'')+'</h4>':l+'<br>').join('');
   if(/^[-*] /.test(p)) return '<ul>'+p.split('\n').map(l=>'<li>'+l.replace(/^[-*] /,'')+'</li>').join('')+'</ul>';
   return '<p>'+p.replace(/\n/g,'<br>')+'</p>';
 }).join('');
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
async function api(path,data){let r=await fetch(path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Harness-Lab':'1'},body:JSON.stringify(data)});let j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j;}
function renderStages(){
 $('#stages').innerHTML=boot.stages.map((s,i)=>`<button class="stage-button ${i===stage?'active':i<stage?'completed':''}" data-stage="${i}" ${busy?'disabled':''} aria-current="${i===stage?'step':'false'}"><span class="number">${String(i).padStart(2,'0')}</span>${s.name}</button>`).join('');
 $$('#stages button').forEach(b=>b.onclick=()=>selectStage(+b.dataset.stage));
}
function renderLesson(){
 const s=boot.stages[stage];document.documentElement.style.setProperty('--stage',colors[stage]);
 $('#stage-index').textContent=String(stage).padStart(2,'0');$('#stage-tag').textContent=s.tag;$('#stage-title').textContent=s.title;$('#stage-why').textContent=s.why;$('#scenario-text').textContent=s.prompt;$('#observe-text').textContent=s.observe;
 $('#capabilities').innerHTML=boot.stages.map((s,i)=>`<span class="capability ${i<=stage?'enabled':''} ${i===stage?'current':''}">${i<=stage?'✓ ':''}${s.feature}</span>`).join('');
 $('#next-stage').disabled=stage===7||busy;$('#presenter-notes').innerHTML='<strong>Demo cue</strong><br>'+esc(notes[stage]);
 $('.lesson-pane').classList.remove('stage-enter');void $('.lesson-pane').offsetWidth;$('.lesson-pane').classList.add('stage-enter');
 $('#compact').disabled=stage<6||busy;renderStages();
}
function welcome(){
 $('#chat').innerHTML=`<div class="welcome"><div class="welcome-glyph">m.</div><h3>Good work starts here.</h3><p>${stage===0?'A simple chatbot, ready for its first task. Each new layer changes what it can do.':'Company knowledge. Your way of working. A harness you can inspect.'}</p><div class="suggestions"><button data-prompt="${esc(boot.stages[stage].prompt)}">${stage===0?'Prepare a customer proposal':'Try this layer’s scenario'} ↗</button><button data-prompt="${stage>=5?'What was our company revenue in Q3 2026? Use a tool if available.':'What do you know about Meridian Systems?'}">${stage>=5?'Test role boundaries':'Ask about the company'} ↗</button></div></div>`;
 $$('.suggestions button').forEach(b=>b.onclick=()=>{$('#prompt').value=b.dataset.prompt;$('#prompt').focus();});
}
function message(kind,text){
 $('.welcome')?.remove();$('#thinking')?.remove();const d=document.createElement('div');d.className='message '+kind;d.innerHTML=`<div class="message-label">${kind==='user'?'You':kind==='error'?'Harness':'Meridian'}</div>${md(text)}`;$('#chat').append(d);$('#chat').scrollTop=$('#chat').scrollHeight;
}
function thinking(on){$('#thinking')?.remove();if(on){const d=document.createElement('div');d.id='thinking';d.className='thinking';d.innerHTML='<span></span><span></span><span></span><em>Model request in progress</em>';$('#chat').append(d);$('#chat').scrollTop=$('#chat').scrollHeight;}}
function detail(title,text){$('#detail-title').textContent=title;$('#detail-body').textContent=text;$('#detail-dialog').showModal();}
function pulse(node){$$('.flow-map>span').forEach(n=>n.classList.toggle('active',n.dataset.node===node));}
function addEvent(e,replay=false){
 if(e.kind==='user'||e.kind==='assistant'||e.kind==='error')message(e.kind,e.detail);
 if(e.kind==='model_start'){thinking(!replay);pulse('model');}
 if(e.kind==='model_end')thinking(false);
 if(e.kind==='context')pulse('context');
 if(e.kind==='tool_start'||e.kind==='tool_end')pulse('tool');
 if(['user','assistant','model_end'].includes(e.kind))return;
 $('.trace-empty')?.remove();const idx=traceEvents.push(e)-1;
 const dot=({model_start:'◇',context:'·',tool_start:'↗',tool_end:'✓',tool_error:'!',approval:'!',checkpoint:'✓',decision:'✓',compaction:'↺',error:'!',plan:'≡'})[e.kind]||'·';
 const el=document.createElement('div');el.className='trace-item '+e.kind;
 const t=new Date(e.time*1000).toLocaleTimeString([], {hour12:false});
 el.innerHTML=`<span class="event-dot">${dot}</span><div class="event-content"><strong>${esc(e.title)}</strong><small>${t}</small><p>${esc(e.detail)}</p><button data-event="${idx}">Inspect event ↗</button></div>`;
 el.querySelector('button').onclick=()=>detail(e.title,pretty(e.detail));$('#trace').append(el);$('#trace').scrollTop=$('#trace').scrollHeight;$('#trace-count').textContent=traceEvents.length;
}
function pretty(text){try{return JSON.stringify(JSON.parse(text),null,2);}catch{return text;}}
function renderApproval(){const box=$('#approval-card');box.hidden=!task.pending;if(!task.pending)return;const p=task.pending.preview;
 box.innerHTML=`<h4>Human approval required</h4><p>Local outbox recipient: <strong>${esc(p.recipient)}</strong></p><p>No email is delivered. This action records the exact proposal locally.</p><div class="approval-actions"><button id="inspect-pending">Inspect full proposal</button><button id="reject-pending">Reject</button><button class="approve" id="approve-pending">Approve write</button></div>`;
 $('#inspect-pending').onclick=()=>detail('Pending proposal to '+p.recipient,p.body);$('#reject-pending').onclick=()=>decision(false);$('#approve-pending').onclick=()=>decision(true);
}
function updateStats(){if(!task)return;$('#task-label').textContent=task.title;$('#call-count').textContent=task.calls+' calls';$('#token-count').textContent=task.tokens.toLocaleString()+' tokens';$('#artifact-count').textContent=task.artifacts.length+task.outbox.length;$('#composer-hint').textContent=task.pending?'Resolve the approval before continuing':'Real model responses · synthetic company data';$('#send').disabled=busy||!!task.pending;$('#prompt').disabled=busy||!!task.pending;renderApproval();}
function renderTask(){stage=task.stage;$('#role').value=task.role;renderLesson();traceEvents=[];$('#trace').innerHTML='<div class="trace-empty"><span class="pulse-ring"></span>Run a scenario to see the harness in action.<br>Every event will appear here.</div>';$('#trace-count').textContent='0';welcome();task.events.forEach(e=>addEvent(e,true));thinking(false);pulse('');updateStats();renderArtifacts();}
async function newTask(){if(busy)return;task=await api('/api/new',{stage,role:$('#role').value});sessionStorage.setItem('meridian-task',task.id);renderTask();setTab('conversation');}
async function selectStage(n){if(busy||n<0||n>7)return;stage=n;await newTask();}
function setTab(name){$$('.tab-row button').forEach(b=>{b.classList.toggle('active',b.dataset.tab===name);b.setAttribute('aria-selected',String(b.dataset.tab===name));});$$('.tab-content').forEach(p=>p.classList.toggle('active',p.id==='tab-'+name));if(name==='history')loadHistory();if(name==='artifacts')renderArtifacts();}
function renderArtifacts(){let html='';task.artifacts.forEach((a,i)=>html+=`<div class="artifact-row"><div><strong>${esc(a.name)}</strong><small>Saved in this task’s SQLite workspace</small></div><button data-artifact="${i}">Open ↗</button></div>`);task.outbox.forEach((a,i)=>html+=`<div class="artifact-row"><div><strong>Local outbox entry</strong><small>${esc(a.recipient)} · no email delivered</small></div><button data-outbox="${i}">Inspect ↗</button></div>`);$('#artifacts').innerHTML=html||'<p class="muted">No artifacts or outbox entries in this task yet. Saving becomes available in the Persistence stage.</p>';
 $$('[data-artifact]').forEach(b=>b.onclick=()=>{const a=task.artifacts[+b.dataset.artifact];detail(a.name,a.content);});$$('[data-outbox]').forEach(b=>b.onclick=()=>{const a=task.outbox[+b.dataset.outbox];detail('Local outbox · '+a.recipient,a.body);});
}
async function loadHistory(){const history=await api('/api/history');$('#history').innerHTML=history.map(h=>`<div class="history-row"><div><strong>${esc(h.title)}</strong><small>${new Date(h.updated*1000).toLocaleString()}</small></div><button data-restore="${h.id}" ${busy?'disabled':''}>Restore ↗</button></div>`).join('')||'<p class="muted">Complete a task in the Persistence or Evaluation stage to create a checkpoint.</p>';
 $$('[data-restore]').forEach(b=>b.onclick=async()=>{if(busy)return;task=await api('/api/task?id='+encodeURIComponent(b.dataset.restore));sessionStorage.setItem('meridian-task',task.id);renderTask();setTab('conversation');toast('Restored task state from SQLite');});
}
function setBusy(v){busy=v;$('#role').disabled=v;$('#new-task').disabled=v;$('#compact').disabled=v||stage<6;$('#run-checks').disabled=v;$('#live-check').disabled=v;$('#run-status').classList.toggle('busy',v);$('#run-status').innerHTML='<i></i>'+(v?'Running':task?.pending?'Awaiting approval':'Ready');renderStages();$('#next-stage').disabled=v||stage===7;updateStats();}
async function stream(path,data){
 let succeeded=true,completed=false;setBusy(true);try{
  const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Harness-Lab':'1'},body:JSON.stringify(data)});
  if(!r.ok){let j=await r.json();throw Error(j.error);}
  const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='';
  while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});let p;while((p=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,p);buffer=buffer.slice(p+1);if(!line.trim())continue;const e=JSON.parse(line);if(e.kind==='error'){succeeded=false;toast(e.detail);}if(e.kind==='done'){completed=true;task=e.state;updateStats();}else addEvent(e);}if(done)break;}
  if(!completed)throw Error('Connection ended before completion. Restore this task before retrying.');
 }catch(e){succeeded=false;message('error',e.message);toast(e.message);}finally{thinking(false);pulse('');setBusy(false);renderArtifacts();}
 return succeeded;
}
async function sendPrompt(prompt){if(busy)return;setTab('conversation');$('#prompt').value='';await stream('/api/run',{id:task.id,prompt});}
async function decision(approve){if(busy||!task.pending)return;await stream('/api/decision',{id:task.id,nonce:task.pending.nonce,approve});}
function syntax(source,start){return source.trimEnd().split('\n').map((line,i)=>{
 let out='',last=0;const rx=/(#[^\n]*|'[^']*'|"[^"]*"|\b(?:def|if|else|elif|return|for|in|while|with|as|raise|not|and|or|True|False|None|class|try|except|import|from)\b)/g;
 for(const m of line.matchAll(rx)){out+=esc(line.slice(last,m.index));const kind=m[0][0]==='#'?'comment':/^['"]/.test(m[0])?'str':'kw';out+=`<span class="${kind}">${esc(m[0])}</span>`;last=m.index+m[0].length;}out+=esc(line.slice(last));
 return `<span class="code-line" style="animation-delay:${Math.min(i*20,300)}ms"><span class="line-no">${start+i}</span>${out}</span>`;
 }).join('');}
function showCode(){const snippet=boot.snippets[stage];$('#code-title').textContent=boot.stages[stage].name;$('#code-file').textContent=snippet.file+' : '+snippet.line;$('#code-body').innerHTML=syntax(snippet.code,snippet.line);$('#code-dialog').showModal();}
async function runChecks(){const button=$('#run-checks');button.disabled=true;try{const r=await api('/api/checks',{});$('#checks').innerHTML=r.checks.map(c=>`<div class="check-row ${c.passed?'':'fail'}"><span class="check-icon">${c.passed?'✓':'×'}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.evidence)}</small></div></div>`).join('');toast(r.checks.filter(c=>c.passed).length+' of '+r.checks.length+' contract checks passed');}catch(e){toast(e.message);}finally{button.disabled=false;}}
async function liveCheck(){
 if(busy)return;stage=7;$('#role').value='Sales';await newTask();await sendPrompt('Look up Helix Manufacturing, then give a short proposal with the record ID, confirmed timeline, EU hosting requirement, and pricing approval status. Do not send anything.');
 const final=task.events.filter(e=>e.kind==='assistant').map(e=>e.detail).join('\n');const used=task.events.some(e=>e.kind==='tool_end'&&e.title==='customer_lookup');const errors=task.events.some(e=>e.kind==='error');const passed=used&&/CRM-1042/i.test(final)&&/approv/i.test(final)&&!errors;
 $('#live-check-result').innerHTML=`<div class="check-row ${passed?'':'fail'}"><span class="check-icon">${passed?'✓':'×'}</span><div><strong>${passed?'Smoke test passed':'Smoke test needs inspection'}</strong><small>Customer tool: ${used?'yes':'no'} · Record cited: ${/CRM-1042/i.test(final)?'yes':'no'} · Approval qualifier: ${/approv/i.test(final)?'yes':'no'}</small></div></div>`;setTab('checks');
}
function bind(){
 $('#focus-mode').onclick=()=>{document.body.classList.toggle('focus');$('#focus-mode').textContent=document.body.classList.contains('focus')?'Exit focus':'Focus demo';};
 $('#reveal-code').onclick=showCode;$$('.close-code').forEach(b=>b.onclick=()=>$('#code-dialog').close());$('#close-detail').onclick=()=>$('#detail-dialog').close();$('#copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(boot.snippets[stage].code);toast('Copied actual Python source');}catch{toast('Select and copy the code manually.');}};
 $('#next-stage').onclick=()=>selectStage(stage+1);$('#use-scenario').onclick=()=>{$('#prompt').value=boot.stages[stage].prompt;setTab('conversation');$('#prompt').focus();};$('#new-task').onclick=newTask;$('#role').onchange=newTask;
 $('#prompt-form').onsubmit=e=>{e.preventDefault();const p=$('#prompt').value.trim();if(p)sendPrompt(p);};$('#prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#prompt-form').requestSubmit();}};
 $$('.tab-row button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));$('#run-checks').onclick=runChecks;$('#live-check').onclick=liveCheck;$('#compact').onclick=async()=>{setTab('conversation');if(await stream('/api/compact',{id:task.id}))toast('Context summarized. Full prior messages remain in the local checkpoint archive.');};
 $('#presenter-toggle').onclick=()=>{$('#presenter-notes').hidden=!$('#presenter-notes').hidden;};$('#motion').onclick=()=>{document.body.classList.toggle('reduced-motion');localStorage.setItem('meridian-reduced',document.body.classList.contains('reduced-motion'));toast(document.body.classList.contains('reduced-motion')?'Reduced motion enabled':'Animations enabled');};
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Use your browser’s fullscreen shortcut.');}};
 $('#test-connection').onclick=async()=>{const b=$('#test-connection');b.disabled=true;b.textContent='Testing…';try{const r=await api('/api/ping',{});$('#connection-dot').classList.add('ready');$('#model-label').textContent=r.status.model;toast('Live model answered: '+r.response);}catch(e){toast(e.message);}finally{b.disabled=false;b.textContent='Test connection';}};
 $('#export-trace').onclick=()=>{const blob=new Blob([JSON.stringify({task:task.title,stage:task.stage,role:task.role,calls:task.calls,tokens:task.tokens,events:task.events},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='meridian-trace-'+task.id.slice(0,8)+'.json';a.click();URL.revokeObjectURL(a.href);};
 document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||$('dialog[open]'))return;if(e.key==='ArrowRight'){e.preventDefault();selectStage(stage+1);}if(e.key==='ArrowLeft'){e.preventDefault();selectStage(stage-1);}if(e.key.toLowerCase()==='c')showCode();if(e.key.toLowerCase()==='n')$('#presenter-toggle').click();});
}
async function init(){try{boot=await api('/api/bootstrap');$('#model-label').textContent=boot.status.configured?boot.status.model+' · live API':'Add model credentials in .env';$('#connection-dot').classList.toggle('ready',boot.status.configured);if(localStorage.getItem('meridian-reduced')==='true')document.body.classList.add('reduced-motion');bind();const previous=sessionStorage.getItem('meridian-task');if(previous){try{task=await api('/api/task?id='+encodeURIComponent(previous));renderTask();return;}catch{sessionStorage.removeItem('meridian-task');}}await newTask();}catch(e){toast('Local server error: '+e.message);$('#model-label').textContent='Local server unavailable';}}
init();
