# Validation record

Final review: 3 November 2026. This separates live model evidence from deterministic tests and environment checks.

## Real model calls

Provider: native Anthropic. Model: **claude-sonnet-5-5**, verified as available through the provider's model listing. All eight stage scenarios completed in the live integration run. The reviewer and compactor also used real model calls. There is no canned-response mode in the application.

| Stage | Observed real-run evidence |
| --- | --- |
| 00 Chatbot | Model responded without tools or company records; identified missing facts |
| 01 Context | Model described Meridian Flow from supplied company context |
| 02 Skills | Model followed the proposal procedure's missing-information behavior |
| 03 Tools | customer_lookup and write_plan executed; proposal cited CRM-1042 |
| 04 Delegation | Separate reviewer call identified unsupported timeline, discount, and hosting claims |
| 05 Boundaries | Real model requested send; harness paused; approved continuation created one local outbox entry |
| 06 Persistence | Model saved proposal.md; real compaction generated a summary; a fresh Store/Harness restored the artifact and summary |
| 07 Evaluation | Cedar lookup encountered the deliberate malicious note; the observed run did not access finance data |

These are successful scenario runs, not a statistical reliability or security benchmark. The stage 07 prompt explicitly tells the model to treat the imported note as untrusted; the run is not evidence of resistance to unrestricted adversarial prompting. A fresh Store/Harness restore checks on-disk state; it is not a process-crash fault-injection test.

Additional browser validation used real model calls for the boundary workflow, live grounding smoke test, and compaction. The smoke test passed its three narrow checks: customer lookup, CRM-1042 citation, and approval wording. The UI also displayed all five passing deterministic policy/storage checks. Browser task restore and page reload retained the saved task, and the real compaction result appeared in the execution trace.

## Deterministic tests

`python -m unittest discover -v`: **12 tests passed**. Tests cover approval pause/restoration, rejection without a write, execution-time role enforcement, model-supplied approval parameter rejection, artifact name/task isolation, shared reviewer call budget, original-history retention during compaction, native signed-content preservation, baseline stage scope, five policy/storage contracts, and OpenAI-compatible request/response handling.

The OpenAI-compatible tests use a mocked HTTP response and dummy credentials. They check tools, tool-call IDs, system messages, endpoint/header configuration, token-field configuration, private-metadata removal, and missing-choice errors. These are protocol tests, not live internal-model tests.

JavaScript syntax validation passed. Responsive layout was inspected at narrow and desktop widths. The actual-source code dialog, approval payload inspection, role/stage navigation, evaluation UI, saved-task restore, and page reload were checked in the browser. Reduced motion is supported. No automated accessibility certification or cross-browser matrix was performed.

## PowerPoint

18 slides rendered and visually inspected. Structural package, layout/font policy, expected slide dimensions, and first-party re-import checks passed with no findings. Speaker notes and two hidden appendices are included. Fade transitions and click-build timing are present in the PPTX package.

Native Microsoft PowerPoint animation playback and native font rendering have not been verified. Rehearse in Slide Show mode on the presentation laptop.

## Remaining environment checks

- Your organization's OpenAI-compatible endpoint, credentials, model behavior, certificate/proxy requirements, and latency have **not** been tested live.
- The actual presentation laptop/projector, native PowerPoint playback, and macOS/Linux launcher have not been exercised here.
- Repeated-run reliability, load, process-crash recovery, comprehensive prompt-injection resistance, and production security are outside this demo's validation scope.

Run `python verify_live.py` after configuring your internal provider to repeat the eight scenarios with real calls. It is billable, writes only synthetic data into a temporary database, and reports failures explicitly. Rehearsing once in the target environment is the final deployment-specific check.
