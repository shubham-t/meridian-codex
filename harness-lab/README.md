# Meridian Harness Lab

A Python teaching app that turns a chatbot into a tool-using agent, one visible layer at a time. Python 3.10+, standard library only. No frontend build, database installation, or pip dependencies.

## Run locally

Copy `.env.example` to `.env`, enter credentials locally, and run:

```powershell
python server.py
```

Alternatively double-click `start.bat` on Windows or run `sh start.sh` on macOS/Linux. The Windows launcher tries `py -3`, `python`, then the bundled Codex Python if installed. Keep the terminal open. Visit http://127.0.0.1:8765/ and click **Test connection**. Stop the server with Ctrl+C.

The local `.env` takes precedence over environment variables. It is read on each new model instance, so begin a new task after changing provider/model. Restart the server after changing PORT. The header indicates configured credentials; Test connection verifies actual inference access. Keys are never sent to the browser. Do not distribute `.env` or `.runtime`.

### Anthropic, used for this workshop's live validation

```dotenv
PROVIDER=anthropic
MODEL=claude-sonnet-5-5
ANTHROPIC_API_KEY=your-key-entered-locally
```

The native adapter preserves signed model content across tool calls. The UI displays observable actions and results, not private model reasoning. Live responses, reviewer calls, compaction, and connection checks use the selected provider and incur its normal usage charges.

### Your organization's Chat Completions gateway

Replace the active provider/model settings and add:

```dotenv
PROVIDER=openai-compatible
MODEL=your-internal-model-id
OPENAI_BASE_URL=https://your-model-gateway.example/v1
OPENAI_API_KEY=your-key-entered-locally
```

The adapter appends `/chat/completions` to the base URL. For a different route set the complete `CHAT_COMPLETIONS_URL`. It sends standard `messages`, `tools`, and `tool_choice: auto` and accepts `choices[0].message.tool_calls`.

Optional settings:

| Setting | Default / purpose |
| --- | --- |
| AUTH_HEADER | Authorization; change for a gateway-specific header |
| AUTH_PREFIX | Bearer; set empty for a raw key header |
| MAX_TOKENS_FIELD | max_tokens; use max_completion_tokens if required, or empty to omit |
| SSL_CERT_FILE | Path to an approved company CA PEM bundle; TLS verification stays enabled |
| MAX_MODEL_CALLS | 10 per user turn, including reviewer calls |
| MAX_OUTPUT_TOKENS | 1800 per completion |
| REQUEST_TIMEOUT | 90 seconds per HTTP request |
| PORT | 8765; localhost only |

After switching, start a new task, click Test connection, run the Tools scenario, and run the live grounding smoke test. Protocol contract tests pass locally, but your organization's gateway and model have not been tested live. Provider differences can change tool selection, latency, formatting, and reliability.

## Layers and behavior

| Stage | Added component | Visible evidence |
| --- | --- | --- |
| 00 Chatbot | Model only | No company or customer access |
| 01 Context | Company guidance loaded into each request | Knows Meridian, still lacks CRM facts |
| 02 Skills | Explicitly loaded proposal procedure | Reusable sections and missing-fact questions |
| 03 Tools | Bounded model/tool loop | Customer lookup and visible plan |
| 04 Delegation | Isolated reviewer model call, no write tools | Finds unsupported commitments |
| 05 Boundaries | Role authorization, recipient validation, human approval | Pauses before a local outbox write |
| 06 Persistence | SQLite checkpoints, artifacts, model compaction | Restore work and inspect saved proposal |
| 07 Evaluation | Contract checks and live smoke test | Separate policy evidence from model behavior |

Each stage includes previous components. Selecting a stage or role creates a fresh task so earlier messages do not mask the added capability. The model chooses its tool calls; it may ask a question instead of following the demonstration exactly. Ask it explicitly to use the relevant tool when needed.

Stages 00–05 keep conversational state in server memory. Stages 06–07 checkpoint state to `.runtime/harness.sqlite3`. Artifacts and outbox entries are stored in SQLite, scoped to the task. Saved tasks lists persisted checkpoints. Compaction is a real model summary: the full prior message history stays in the checkpoint archive, but the model's active context is replaced with the summary. Summaries can omit details. Restore does not roll back previously recorded outbox entries.

`send_proposal` records the exact approved body in a **local outbox**. It never sends email. Approval is bound to the pending payload and a one-time nonce. Repeating the same tool-call ID creates one outbox record; a new tool call is a new action and may create another entry. Before the Boundaries stage, synthetic tool actions deliberately lack the later role and approval controls for teaching purposes.

The role selector demonstrates authorization rules; it is not authenticated identity. Skills are explicit prompt content, not automatic discovery, fine-tuning, or security enforcement. The reviewer is one separate model call, not an autonomous team or a correctness guarantee. Production deployment would need real authentication, tenant isolation, stronger validation, durable jobs, operational controls, and broader evaluations.

## Code map

| File | Responsibility |
| --- | --- |
| harness.py | Stage definitions, context, skill, tool loop, authorization, reviewer, SQLite persistence, checks |
| providers.py | Native Anthropic and OpenAI-compatible adapters |
| server.py | Local HTTP API, NDJSON events, task locking, static file allowlist |
| web/app.js | Stage navigation, source reveal, event trace, approval and task UI |
| web/style.css | Responsive visual design, animation, reduced motion |
| data/company.md | Fictional company context |
| data/proposal-skill.md | Reusable proposal procedure |
| data/customers.json | Synthetic CRM and deliberate untrusted-note fixture |
| test_harness.py / test_providers.py | Deterministic behavior and adapter tests |
| verify_live.py | Optional billable eight-stage integration rehearsal |

## Verify

```powershell
python -m unittest discover -v
python verify_live.py
```

The first command uses scripted model responses and mocked HTTP, so no API calls are billed. The second uses the configured real provider, runs all eight stages in a temporary database, approves one synthetic outbox action, compacts context, and restores saved state. It writes a local report to `.runtime/live-validation.json`; no key is included. Model output varies. Inspect assertions and the report; one run is not a reliability benchmark.

In the UI, **Run 5 contract checks** uses actual Python policy/storage code in an isolated temporary database and makes no LLM calls. **Run with live model** checks only customer-tool use, a CRM-1042 citation, and an approval qualifier without an error. It does not establish complete factual accuracy or injection resistance.

## Troubleshooting

- 401/403: verify the local key, model entitlement, or organization's network policy. The app avoids returning provider response bodies that could echo credentials.
- 404: check the full endpoint and exact model ID.
- 400: check tool calling support and MAX_TOKENS_FIELD. Ask your gateway team for the supported schema.
- Output limit: increase MAX_OUTPUT_TOKENS locally, start a new task, and retry.
- Connection error: check network, timeout, proxy policy, and the approved CA bundle. Do not disable certificate verification.
- Already-running task: wait for the active request. For interrupted persistent tasks, restore and inspect artifacts/outbox before retrying.
- Port in use: stop the previous server you launched or set a different PORT and restart. The PowerPoint demo link uses the default port.
- API unavailable during the session: use the included screenshot, actual source, and test report as a clearly labeled recorded example. The app never silently substitutes canned model answers.

Reference: [Anthropic tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works), [Sonnet 5.5 migration](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide), [Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).
