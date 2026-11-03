"""Local teaching application. Run: python server.py (Python 3.10+)."""
import json
import mimetypes
import os
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from harness import Harness, STAGES, source_snippets, contract_checks
from providers import ROOT, Model, config, status

APP = Harness()
PORT = int(config().get('PORT', 8765))
WEB = ROOT / 'web'


def repair_unfinished(session):
    if session.get('pending'):
        return
    answered = {m.get('tool_call_id') for m in session['messages'] if m['role']=='tool'}
    for m in list(session['messages']):
        for call in m.get('tool_calls', []):
            if call['id'] not in answered:
                session['messages'].append({'role':'tool','tool_call_id':call['id'],
                    'content':json.dumps({'error':'Execution interrupted. Do not assume completion. Inspect saved artifacts/outbox before retrying.'})})


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def json_response(self, data, code=200):
        raw = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        self.wfile.write(raw)

    def trusted_host(self):
        return self.headers.get('Host') in {f'127.0.0.1:{PORT}',f'localhost:{PORT}'}

    def do_GET(self):
        if not self.trusted_host():
            return self.json_response({'error':'This demo only serves localhost.'},403)
        url = urlparse(self.path)
        try:
            if url.path == '/api/bootstrap':
                return self.json_response({'stages':STAGES,'snippets':source_snippets(),'status':status(),'history':APP.store.history()})
            if url.path == '/api/history':
                return self.json_response(APP.store.history())
            if url.path == '/api/task':
                task_id = parse_qs(url.query).get('id',[''])[0]
                return self.json_response(APP.public(APP.get(task_id)))
            name = url.path.strip('/') or 'index.html'
            if name not in {'index.html','app.js','style.css'}:
                return self.json_response({'error':'Not found'},404)
            path = WEB / name
            raw = path.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type',(mimetypes.guess_type(name)[0] or 'text/plain')+'; charset=utf-8')
            self.send_header('Content-Length',str(len(raw)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(raw)
        except (ValueError, KeyError, FileNotFoundError):
            self.json_response({'error':'Task or resource not found'},404)

    def do_POST(self):
        origin = self.headers.get('Origin')
        if (not self.trusted_host() or self.headers.get('X-Harness-Lab') != '1' or
            (origin and origin not in {f'http://127.0.0.1:{PORT}', f'http://localhost:{PORT}'})):
            return self.json_response({'error':'Local same-origin requests only.'},403)
        size = int(self.headers.get('Content-Length','0'))
        if size > 100000:
            return self.json_response({'error':'Request too large'},413)
        try:
            data = json.loads(self.rfile.read(size))
            if self.path == '/api/new':
                return self.json_response(APP.public(APP.new(data.get('stage',0),data.get('role','Sales'))))
            if self.path == '/api/checks':
                return self.json_response({'checks':contract_checks(APP),'label':'Deterministic contract checks; no model calls'})
            if self.path not in {'/api/run','/api/decision','/api/compact','/api/ping'}:
                return self.json_response({'error':'Not found'},404)
            if self.path == '/api/ping':
                answer,tokens = Model().complete('Respond briefly.',[{'role':'user','content':'Reply with READY.'}],[])
                return self.json_response({'ok':True,'response':answer['content'],'tokens':tokens,'status':status()})
            session = APP.get(data['id'])
        except Exception as exc:
            return self.json_response({'error':str(exc)},400)
        lock = APP.lock(session['id'])
        if not lock.acquire(blocking=False):
            return self.json_response({'error':'This task is already running.'},409)
        self.send_response(200)
        self.send_header('Content-Type','application/x-ndjson; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers()
        def sink(event):
            self.wfile.write((json.dumps(event,ensure_ascii=False)+'\n').encode())
            self.wfile.flush()
        try:
            if self.path == '/api/run':
                APP.run(data['id'],data.get('prompt',''),sink)
            elif self.path == '/api/decision':
                if type(data.get('approve')) is not bool:
                    raise ValueError('Approval must be a boolean.')
                APP.decide(data['id'],data.get('nonce'),data['approve'],sink)
            else:
                APP.compact(data['id'],sink)
        except (BrokenPipeError, ConnectionResetError):
            repair_unfinished(session)
        except Exception as exc:
            repair_unfinished(session)
            try:
                APP.emit(session,sink,'error','Run stopped',str(exc))
            except (BrokenPipeError,ConnectionResetError):
                pass
        finally:
            APP.store.checkpoint(session)
            try:
                sink({'kind':'done','state':APP.public(session)})
            except (BrokenPipeError,ConnectionResetError):
                pass
            lock.release()


if __name__ == '__main__':
    print(f'Meridian Harness Lab: http://127.0.0.1:{PORT}',flush=True)
    print('Local teaching app. Synthetic records. Outbox writes do not deliver email.',flush=True)
    ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
