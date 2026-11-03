# Working on Meridian

Read `AGENT-HANDOFF.md` first, then `TEST-RESULTS.md` and `harness-lab/README.md`. Preserve the staged workshop and current visual design when configuring the organization model provider.

- The demo requires only Python 3.10+ standard library. Do not add a frontend build or framework for provider setup.
- Run deterministic tests from `harness-lab`: `python -m unittest discover -v`.
- Real-call validation is separate: `python verify_live.py`. It uses the configured provider and consumes quota. Confirm the selected endpoint is permitted in this environment before running it. Do not make Anthropic calls from the organization laptop.
- Use `.env.internal.example` for organization setup. Keep credentials, internal endpoint details, runtime databases, local reports, and traces out of commits. Do not print keys.
- Do not disable TLS verification, execution-time role checks, recipient validation, or approval gates to get tests passing.
- The outbox is synthetic/local, the role selector is not authentication, and passing samples are not a production reliability or security certification.
- Changing stage/role starts a new task. Preserve this clean demonstration boundary. The code dialog reads actual Python source.
- Record actual test scope accurately. Existing real-call evidence is for Anthropic; internal-gateway verification must be reported separately.
- The PowerPoint is directly editable. Optional presentation-source scripts need the approved presentation authoring runtime and are not application dependencies.
