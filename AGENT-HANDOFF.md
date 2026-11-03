# Agent handoff: Meridian Harness Workshop

Prepared 3 November 2026. Repository: https://github.com/shubham-t/meridian-codex

## Mission and user intent

Set up this existing workshop on the user's organization laptop and connect it to the organization's approved internal LLM gateway. Preserve the completed presentation and polished interactive demonstration. This is a 45-minute session for a mixed audience of engineers and managers, using fictional Meridian Systems and synthetic customer records. The teaching sequence is **explain a component → reveal its actual code → run a scenario → inspect what changed**.

The original inspiration is [Aish Reganti's video](https://www.youtube.com/watch?v=mv9kfF_kJd0) and its [companion guide](https://github.com/aishwaryanr/awesome-generative-ai-guide/blob/main/youtube/build-your-own-harness.md). The implementation here is an original standard-library Python harness, not that video's framework implementation. The user requested visually appealing themes, animations, an editable PowerPoint, and real LLM calls.

The user has confirmed that the internal endpoint supports **OpenAI Chat Completions with tool/function calling**. The organization laptop does **not** permit Anthropic model access. Anthropic was authorized only for development on the original machine. Do not try to bypass the organization restriction. The endpoint, internal model name, authentication details, and network/certificate requirements are still unknown. Credentials are deliberately absent from Git.

## Read first, in this order

1. This document, then `START-HERE.md` and `harness-lab/README.md`.
2. `TEST-RESULTS.md` for the precise validation boundary; `evidence/` contains the original recorded synthetic live-run report and presentation validation summary when using the Git repository.
3. `PRESENTER-RUNBOOK.md` for the 45-minute sequence and fallback prompts.
4. `harness-lab/providers.py`, `harness-lab/.env.internal.example`, `harness-lab/server.py`, and `harness-lab/harness.py` before editing behavior.

Do not rebuild the application or replace the UI just to change providers. The provider adapter is already implemented. There is no React build, pip dependency, vector database, external email service, or agent framework to install.

## What is implemented

| Area | Implementation |
| --- | --- |
| Presentation | `Agent-Harness-Workshop.pptx`: 18 editable slides, 16 main + 2 hidden appendices, speaker notes, fades, selected click builds |
| Python app | `harness-lab/server.py`: localhost HTTP server; NDJSON events; same-origin/Host checks; task locks; interrupted tool-pair recovery |
| Agent loop | `harness-lab/harness.py`: staged capabilities, canonical conversation history, tool dispatch, shared call budget, task state |
| Model adapters | `providers.py`: native Anthropic for prior testing; configurable OpenAI-compatible Chat Completions for the organization |
| UI | `web/index.html`, `style.css`, `app.js`: dark graphite/mint/amber design, pale chat workspace, live execution trace, animated code reveals and stage changes, focus/fullscreen/presenter/reduced-motion controls |
| Data and skill | `data/company.md`, `proposal-skill.md`, `customers.json`: fictional business guidance, explicit reusable procedure, synthetic CRM |
| Persistence | SQLite under `harness-lab/.runtime/`; task checkpoints, task-scoped Markdown artifacts, local outbox |
| Testing | 12 deterministic tests, five UI contract checks, narrow live smoke test, `verify_live.py` eight-stage real-provider rehearsal |
| Presenter materials | Setup guide, timed runbook, screenshots, generated artwork, and ZIP bundle |

The eight cumulative stages are 00 Chatbot, 01 Context, 02 Skills, 03 Tools, 04 Delegation, 05 Boundaries, 06 Persistence, 07 Evaluation. Choosing another stage or role creates a new task; it does not modify the existing task. The source-code dialog introspects actual Python functions, rather than displaying unrelated illustrative snippets.

**Key behavior to preserve:**

- The model selects tools; Python executes them. Customer lookup, visible planning, proposal review, saving, and local outbox writes are real code acting on synthetic data.
- The reviewer is an isolated model call with customer facts and no write tools. It shares the parent turn's call budget. It is not a correctness guarantee.
- From stage 05, roles filter exposed tools and are enforced again during execution. Send pauses for a human decision bound to the exact payload and a one-time nonce. Recipient validation still applies after approval. A model cannot authorize itself through an extra argument.
- `send_proposal` only writes a local SQLite outbox. It never delivers email. Repeating the same task/tool-call ID is idempotent; a newly generated call is a new action.
- Stages 00–05 keep conversation state in server memory; stages 06–07 checkpoint it. Browser reload/restore uses server/SQLite state. Compaction makes a real model summary and archives original messages, but only the summary remains in active model context. It may lose detail.
- The early stages intentionally lack later controls for teaching. The role dropdown is not authenticated identity. Skills are prompt content, not model training or security enforcement.
- No simulated-response fallback exists. The UI exposes errors if provider access fails. Traces show observable events, not private reasoning.

## Current completion status

The workshop implementation, visuals, PowerPoint, guides, and delivery bundle are complete. The previous local test server was stopped. No agent process or server is assumed to exist on this laptop. The original local `.env`, SQLite database, caches, and intermediate build files are not in the repository.

What remains is **target-environment integration and rehearsal**: internal model configuration, real calls through that gateway, browser walkthrough on this laptop, and native PowerPoint Slide Show playback. This does not require redesigning the project. Production hosting, real CRM/email integration, SSO, multi-tenant authorization, and reliability/security benchmarking were not requested and are outside the completed teaching demo.

## What was actually tested

**Real model:** native Anthropic `claude-sonnet-5-5`. Its availability was checked against the provider model listing. All eight stage scenarios completed with real calls; the reviewer and compactor also made real calls. Observed evidence includes CRM lookup and planning, reviewer findings against a flawed proposal, approval pause followed by one local outbox write, saved `proposal.md`, summary generation, and a fresh Harness/Store restoring artifact/summary from disk. The Cedar untrusted-note scenario did not access finance data in the observed run.

**Browser:** real approval workflow, live grounding smoke test, real compaction, code dialog, payload inspection, saved-task restore and reload, five contract checks, and narrow/desktop layout inspection. The live smoke test checks only lookup use, CRM-1042 citation, approval wording, and absence of an error.

**Deterministic:** `python -m unittest discover -v` from `harness-lab` passed 12 tests. These use scripted model replies/mocked transport. They cover approval restoration, rejection without a write, role enforcement, injected approval argument rejection, artifact isolation, reviewer call budget, compaction archive, native signed-content preservation, baseline scope, five storage/policy contracts, and OpenAI-compatible request/response handling.

**Slides/package:** all 18 slides rendered and inspected; package integrity, layout/font rules, dimensions, and first-party import passed without findings. ZIP integrity and exclusion of the original credentials/runtime data were checked.

**Not verified:** live internal gateway/model behavior; native PowerPoint animation/font playback; actual projector; macOS/Linux launcher; repeated-run reliability, crash fault injection, load, comprehensive adversarial security, or production readiness. A fresh Store restore is not a process-crash test. The Cedar prompt explicitly labels the note untrusted, so do not present it as unrestricted prompt-injection resistance. See `TEST-RESULTS.md` for detail. The delivered verification assertions were also checked against the original eight-run report; their presence does not imply a second complete live run occurred.

## Gather the missing organization context

Inspect approved local developer documentation and existing organization model-integration examples if available. Ask only for details that cannot be found there. Do not print credential values or copy organization context into GitHub.

| Needed detail | Why |
| --- | --- |
| Approved Python 3.10+ executable | App runs with the standard library; no pip installation required |
| Full Chat Completions URL or base URL | Distinguishes `/v1/chat/completions` from custom/deployment routes |
| Exact model/deployment ID | Sent as `model`; some gateways also encode deployment in the URL |
| Authentication scheme | Current adapter supports one configurable static header/prefix; API key or locally supplied bearer token |
| Token field | `max_tokens`, `max_completion_tokens`, or omission |
| VPN/proxy/CA requirements | Establish approved connectivity while preserving TLS verification |
| Tool-call support details | Accepts `tools`, `tool_choice: auto`, tool-role messages, and standard `choices` response |
| Approved limits | Request timeout, call budget, output size, and rate limits for rehearsal |

If OAuth refresh, multiple extra headers, mTLS, or a nonstandard response format is required, configuration alone may not suffice. Make the smallest change in `providers.py`, add a focused transport test, and document the actual contract. Do not silently translate to a different API family or remove approval enforcement.

## Replace Anthropic with the internal provider

From a fresh clone on the organization laptop:

```powershell
git clone https://github.com/shubham-t/meridian-codex.git
Set-Location meridian-codex/harness-lab
python --version
Copy-Item .env.internal.example .env
```

Use `py -3` or the approved Python executable if `python` is not on PATH. Do not overwrite an existing `.env`; inspect its non-secret configuration and update it deliberately. Enter credentials locally using an approved editor/secret workflow. Never ask the user to paste a key into chat or a tracked file.

Required active configuration in `.env`:

```dotenv
PROVIDER=openai-compatible
MODEL=your-internal-model-id
OPENAI_BASE_URL=https://your-model-gateway.example/v1
OPENAI_API_KEY=enter-your-approved-credential-locally
AUTH_HEADER=Authorization
AUTH_PREFIX=Bearer
MAX_TOKENS_FIELD=max_tokens
PORT=8765
MAX_MODEL_CALLS=10
MAX_OUTPUT_TOKENS=1800
REQUEST_TIMEOUT=90
```

The adapter appends `/chat/completions` to OPENAI_BASE_URL. For a custom route use `CHAT_COMPLETIONS_URL=https://.../complete-path` instead; it takes precedence, and can include a required non-secret API-version query. Do not put a credential in the URL.

For a raw API key header, set `AUTH_HEADER=api-key` (or the actual documented header) and `AUTH_PREFIX=`. If needed set `MAX_TOKENS_FIELD=max_completion_tokens`, or set it empty to omit the limit field. Add `SSL_CERT_FILE=C:/approved/path/company-ca.pem` only when required; never disable certificate verification. `urllib` proxy settings come from the process/OS: entries in this custom `.env` are not automatically exported as process proxy variables. Configure approved process proxy settings as appropriate and keep localhost reachable, for example through the organization's NO_PROXY convention.

Remove Anthropic settings from the organization's `.env` so they cannot be confused with the active provider. Setting `PROVIDER=openai-compatible` routes all agent, reviewer, compactor, and ping calls through the internal adapter. No change to the UI, tools, harness, synthetic data, or slides is needed. Keep the native adapter as optional source code unless the organization explicitly requires its removal.

The `.env` loader overrides environment values and reads configuration on each new Model instance. Avoid duplicate keys. Start a **new task** after changing provider/model; the harness rejects continuing a task with a different provider/model fingerprint. Restart the server for PORT changes. The header's configured indicator is not proof of connectivity; Test connection performs actual inference.

## Validation sequence on the organization laptop

1. From `harness-lab`, run `python -m unittest discover -v`. Expect 12 passing tests; these make no external calls. If you change code, run the relevant tests again.
2. Run `python server.py` or `start.bat`. Keep the terminal open. Open http://127.0.0.1:8765/ and verify the selected **internal** model name before making a call.
3. Click **Test connection**. This makes a real call to the configured internal endpoint. A successful response establishes connectivity, not tool compatibility.
4. Run stage 03 Tools and inspect `customer_lookup`/CRM-1042. This exercises the complete tool-call/result roundtrip.
5. Run `python verify_live.py` from `harness-lab` when real internal calls are permitted. It runs eight scenarios in a temporary DB, approves one synthetic outbox action, compacts and restores, writes `.runtime/live-validation.json`, and exits nonzero on failed assertions. It consumes real model quota. Do not run Python with `-O`, which disables its assertions. Reported stage call/token counts are captured before the extra approval/compaction step, so they are not whole-suite cost totals.
6. Rehearse stage 05 reject/approve and inspect outbox counts. Rehearse stage 06 save/open/new task/restore/reload/compact. Run the five UI contract checks and live smoke test. Inspect output quality as well as pass/fail.
7. Open the deck in native PowerPoint Slide Show. Check fonts, transitions, click builds on slides 4 and 9, presenter notes, and the localhost handoff link. Confirm it reads well at the projector's resolution.
8. Follow the timed runbook. Keep focus mode/reduced motion available. On provider failure, clearly identify saved screenshots/report as prior recorded evidence; do not substitute canned answers as live behavior.

A local terminal error or unmet assertion should be diagnosed, not edited away to force a green result. Different models may choose different tools or ask clarifying questions; distinguish model behavior failures from gateway protocol failures. HTTP 400 usually needs a schema/token-field check; 401/403 needs approved access; 404 needs endpoint/model verification; 429 needs backoff or quota review. For TLS/proxy failures, use the organization's approved network setup.

## Completion report expected from the next agent

Record the provider/model ID and gateway API shape without secrets, the files changed, deterministic test result, actual live scenarios executed, observed failures, and PowerPoint rehearsal status. State precisely what remains blocked, if anything. Keep internal addresses, credentials, sensitive logs, and generated runtime reports local unless the user specifically authorizes publication. Do not overwrite the historical Anthropic report with claims about the internal provider; add a clearly dated local validation record.

Definition of done: the internal provider answers; tool calling works end-to-end; all eight scenarios are exercised or remaining failures are explicit; approval and persistence work in the browser; the 45-minute runbook is usable on the target laptop; and native PowerPoint has been rehearsed or explicitly identified as outstanding.

## Copyable instruction for the receiving agent

> Read AGENT-HANDOFF.md and the referenced project files. Inspect the organization laptop's approved runtime and model documentation, gather missing non-secret gateway details, configure the existing OpenAI-compatible adapter locally, and run the deterministic and real-provider validation sequence. Preserve the workshop's staged behavior and visual design. Do not use Anthropic from this laptop, expose credentials, disable TLS checks, or remove approval controls. Finish setup and report what actually passed and what remains.
