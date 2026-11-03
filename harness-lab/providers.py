"""Small provider adapters. No SDK or third-party dependency required."""
import json
import os
import ssl
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def config():
    values = dict(os.environ)
    path = ROOT / '.env'
    if path.exists():
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            if line.strip() and not line.lstrip().startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                values[key.strip()] = value.strip().strip('\"').strip("'")
    return values


class ProviderError(Exception):
    pass


def status():
    cfg = config()
    native = cfg.get('PROVIDER', 'anthropic') == 'anthropic'
    key = cfg.get('ANTHROPIC_API_KEY' if native else 'OPENAI_API_KEY', '')
    return {'provider': cfg.get('PROVIDER', 'anthropic'), 'model': cfg.get('MODEL', ''),
            'configured': bool(key and cfg.get('MODEL')), 'mode': 'live',
            'max_calls': int(cfg.get('MAX_MODEL_CALLS', 10))}


def anthropic_messages(messages):
    """Translate canonical Chat Completions history, preserving tool-call pairs."""
    result = []
    for msg in messages:
        role = msg['role']
        if role == 'system':
            continue
        if role == 'tool':
            content = [{'type': 'tool_result', 'tool_use_id': msg['tool_call_id'], 'content': msg['content']}]
            role = 'user'
        elif role == 'assistant' and msg.get('_anthropic_content'):
            content = msg['_anthropic_content']
        else:
            content = []
            if msg.get('content'):
                content.append({'type': 'text', 'text': msg['content']})
            for call in msg.get('tool_calls', []):
                try:
                    args = json.loads(call['function']['arguments'])
                except (ValueError, TypeError):
                    args = {}
                content.append({'type': 'tool_use', 'id': call['id'],
                                'name': call['function']['name'], 'input': args})
        if not content:
            content = [{'type': 'text', 'text': '(empty)'}]
        if result and result[-1]['role'] == role:
            result[-1]['content'].extend(content)
        else:
            result.append({'role': role, 'content': content})
    return result


class Model:
    def __init__(self):
        self.cfg = config()
        self.provider = self.cfg.get('PROVIDER', 'anthropic')
        self.name = self.cfg.get('MODEL', '')

    def complete(self, system, messages, tools):
        cfg = self.cfg
        native = self.provider == 'anthropic'
        key = cfg.get('ANTHROPIC_API_KEY' if native else 'OPENAI_API_KEY', '')
        if not key or not self.name:
            raise ProviderError('Configure the model and API key in the local .env file, then retry. No simulated response was generated.')
        headers = {'Content-Type': 'application/json'}
        if native:
            url = cfg.get('ANTHROPIC_BASE_URL', 'https://api.anthropic.com').rstrip('/') + '/v1/messages'
            headers.update({'x-api-key': key, 'anthropic-version': '2023-06-01'})
            payload = {'model': self.name, 'system': system, 'messages': anthropic_messages(messages),
                       'max_tokens': int(cfg.get('MAX_OUTPUT_TOKENS', 1800))}
            if self.name == 'claude-sonnet-5-5':
                payload['thinking'] = {'type': 'between_tools'}
                payload['output_config'] = {'effort': 'medium'}
            if tools:
                payload['tools'] = [{'name': t['function']['name'], 'description': t['function']['description'],
                                     'input_schema': t['function']['parameters']} for t in tools]
        else:
            base = cfg.get('OPENAI_BASE_URL', '').rstrip('/')
            url = cfg.get('CHAT_COMPLETIONS_URL') or base + '/chat/completions'
            prefix = cfg.get('AUTH_PREFIX', 'Bearer')
            headers[cfg.get('AUTH_HEADER', 'Authorization')] = (prefix + ' ' + key).strip()
            clean = [{k:v for k,v in m.items() if not k.startswith('_')} for m in messages]
            payload = {'model': self.name, 'messages': [{'role': 'system', 'content': system}] + clean}
            token_field = cfg.get('MAX_TOKENS_FIELD', 'max_tokens')
            if token_field:
                payload[token_field] = int(cfg.get('MAX_OUTPUT_TOKENS', 1800))
            if tools:
                payload['tools'] = tools
                payload['tool_choice'] = 'auto'
        if not url.startswith('https://') and not url.startswith(('http://localhost:', 'http://127.0.0.1:')):
            raise ProviderError('Use HTTPS for remote model endpoints, or HTTP on localhost.')
        ctx = ssl.create_default_context(cafile=cfg.get('SSL_CERT_FILE') or None)
        request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(request, timeout=int(cfg.get('REQUEST_TIMEOUT', 90)), context=ctx) as response:
                data = json.load(response)
        except urllib.error.HTTPError as exc:
            # Do not return provider response bodies: gateways may echo credentials.
            hints = {401:'Check the local API key.', 403:'Check provider access or organization policy.',
                     404:'Check the endpoint URL and model name.', 429:'Rate limit reached. Wait and retry.',
                     400:'Check model support for tools and MAX_TOKENS_FIELD.'}
            raise ProviderError(f'Model request failed (HTTP {exc.code}). ' + hints.get(exc.code, 'Check the gateway or provider status.')) from None
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise ProviderError('Model connection failed. Check network access, endpoint, timeout and certificate configuration.') from None
        if native:
            if data.get('stop_reason') == 'max_tokens':
                raise ProviderError('Model output reached its token limit. Increase MAX_OUTPUT_TOKENS locally and retry.')
            content = data.get('content', [])
            calls = [{'id': b['id'], 'type': 'function', 'function': {'name': b['name'], 'arguments': json.dumps(b['input'])}}
                     for b in content if b.get('type') == 'tool_use']
            text = '\n'.join(b['text'] for b in content if b.get('type') == 'text')
            usage = data.get('usage', {})
            tokens = usage.get('input_tokens', 0) + usage.get('output_tokens', 0)
        else:
            if not data.get('choices'):
                raise ProviderError('The endpoint did not return a Chat Completions choices array.')
            choice = data['choices'][0]
            if choice.get('finish_reason') == 'length':
                raise ProviderError('Model output reached its token limit. Increase MAX_OUTPUT_TOKENS locally and retry.')
            message = choice['message']
            text = message.get('content') or ''
            calls = message.get('tool_calls') or []
            tokens = data.get('usage', {}).get('total_tokens', 0)
        answer = {'role': 'assistant', 'content': text}
        if native:
            answer['_anthropic_content'] = content
        if calls:
            answer['tool_calls'] = calls
        return answer, tokens
