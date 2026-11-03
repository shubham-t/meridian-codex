# Presenter runbook — 45 minutes

Audience: engineers and managers. Organization: fictional Meridian Systems. Theme: graphite, mint, and amber. The same model gains capabilities as the surrounding software changes.

## Before the room fills

Start the Python server, open http://127.0.0.1:8765/, and Test connection. Run the stage 05 and 06 scenarios once on the actual laptop. Verify readable browser zoom and PowerPoint Slide Show animations. Keep the terminal open, enable Focus demo, and return to stage 00 with a new task. Use the reduced-motion toggle if preferred. Keep this runbook on the presenter screen.

Have the test report and demo screenshot available if network access fails. Describe them as previously captured evidence; do not describe recorded output as live. Do not spend the session debugging provider access.

## 00:00–12:00 — concepts, slides 1–12

| Time | Slides | Say / do |
| --- | --- | --- |
| 00:00–01:30 | 1–2 | “We will keep the model fixed and add the software that lets it do useful work.” Set the 12-minute concepts, 25-minute demo, 8-minute debrief/Q&A expectation. |
| 01:30–03:00 | 3–4 | Ask what a chatbot lacks when asked to prepare a real customer proposal. Build the Decide → Act → Observe → Continue loop with clicks. Python executes tools and decides whether to continue. |
| 03:00–04:30 | 5–6 | Define harness as the surrounding runtime and controls: context, tools, state, boundaries, and observability. A skill is a reusable procedure loaded into context. Neither is model training. |
| 04:30–06:00 | 7 | Walk through the simplified loop. A tool request is structured output; execution and its result are separate. Mention the shared call limit. |
| 06:00–08:00 | 8 | Separate permission (“may this role use this tool?”) from approval (“may this exact action happen now?”). Prompt text cannot enforce either. |
| 08:00–10:00 | 9–10 | Reveal checkpoint, artifact, and summary separately. Summaries can lose facts. Trace explains one run; evaluation measures behavior across cases. |
| 10:00–12:00 | 11–12 | Introduce Helix: requested 2 weeks and 20% off; record says 6-week pilot subject to security review, EU residency requirement, 120 users, pricing awaiting approval. Switch to the browser. |

## 12:00–37:00 — live build, eight layers

Repeat the same rhythm: select the layer → Reveal code → explain the small change → Try it live → Use this prompt → Send → inspect the visible evidence. Code is the actual implementation; you do not need to edit files live. Stage changes create a clean task.

| Session clock | Layer and prompt | What to show and say |
| --- | --- | --- |
| 12:00–14:00 | **00 Chatbot** — “Prepare a rollout proposal for Helix Manufacturing.” | A fluent answer cannot access missing CRM facts. It may ask questions or offer a template. Ask the room which details it would need. |
| 14:00–16:00 | **01 Context** — use suggested prompt | Show company_context loading company.md. The assistant now knows Meridian Flow and company guidance; it still cannot retrieve Helix. |
| 16:00–18:00 | **02 Skills** — use suggested prompt | Show workflow_skill and the five-section procedure. The model may ask for facts before drafting; that is appropriate. Instructions guide behavior but do not guarantee it. |
| 18:00–22:00 | **03 Tools** — use suggested prompt | Inspect customer_lookup input/output and CRM-1042 in the trace. Show write_plan. Explain model selection → Python execution → observation → next call. The tool is real Python over synthetic data. |
| 22:00–25:00 | **04 Delegation** — review the deliberately flawed proposal | Ask the audience to predict the three errors: 2-week guarantee, 20% discount, US-only hosting. Inspect the reviewer result. It receives separate context and has no write tools. It can still be wrong. |
| 25:00–30:00 | **05 Boundaries** — use suggested prepare-and-send prompt | Wait for Human approval required. Inspect the complete body and recipient. Reject once: no outbox write. Then ask “Send that proposal to the verified recipient using send_proposal.” Inspect again and Approve write. Show one local outbox entry. No email was sent. If time permits change to Engineering and ask for company revenue; explain execution-time authorization. Return to Sales before next stage. |
| 30:00–34:00 | **06 Persistence** — use suggested save prompt | Open proposal.md in Artifacts. Open New task, then Saved tasks → Restore. Reload the browser and show the proposal remains. Click Compact context and inspect the summary event. Explain the archived messages versus the smaller active context. |
| 34:00–37:00 | **07 Evaluation** — use Cedar prompt, then Checks | Inspect the imported malicious note as untrusted data and the observed response. Run 5 contract checks. If time permits Run with live model; explain its limited assertions. A passing sample is not an injection-resistance benchmark. |

The demo timings are targets. Network/model latency varies. Use model wait time for audience predictions and inspecting the previous tool result. For a tight run, omit the second approval attempt or the optional live smoke test, while still showing the core boundary and deterministic checks.

## Practical cues

- **No tool call?** Ask explicitly: “Use customer_lookup for Helix Manufacturing, then write_plan.” For delegation: “Call review_proposal with the flawed draft.” For persistence: “Call save_artifact to save the complete draft as proposal.md.”
- **Model asks instead of sending?** Say: “Please use send_proposal with the verified customer email.” The harness will still pause for approval at stage 05 or later.
- **Approval payload is wrong?** Reject it. Ask for a correction and inspect the new payload. This is useful evidence for why approval exists.
- **Compaction is disabled?** It appears in the Persistence/Evaluation Saved tasks panel. Finish the run, resolve pending approval, and return to a task with history.
- **Budget or network failure?** Explain the visible failure, use a fresh task where appropriate, and inspect existing artifacts/outbox before retrying. No silent fallback answers exist.
- **Repeat a layer?** Select the layer again or click New task. Stage/role changes do not upgrade the existing conversation.
- **Show exact code?** C opens the actual function and filename/line number; close with Escape. N shows stage-specific notes. Left/right arrows change layers outside text fields.

## 37:00–45:00 — debrief and discussion, slides 13–16

37:00–38:00: “What changed was knowledge, action, control, and continuity around the model.” Ask which layer mattered most to the organization.

38:00–39:00: Distinguish the teaching system from production: role dropdown versus authenticated identity, SQLite versus operational durability, one reviewer versus measured accuracy, local outbox versus a real external integration.

39:00–40:00: Pick a first pilot with a workflow owner, a measurable outcome, and an action that can be reviewed. Candidate measures: factual accuracy, completion rate, correct tool use, unauthorized action rate, latency, and cost.

40:00–45:00: Q&A. Useful answers:

- **Is a harness a framework?** It is the surrounding system; a framework can implement parts of it. This demo deliberately uses simple Python so the mechanics remain visible.
- **Does adding a reviewer make the output correct?** No. It adds another check whose value must be evaluated.
- **Is saving a summary memory?** It is one mechanism. Checkpoints, artifacts, and summaries solve different needs; summaries can discard details.
- **Can we switch models?** Yes, using the Chat Completions adapter, but tool support and behavior need live testing on the actual gateway.
- **Is it secure?** It demonstrates specific enforcement mechanisms. It is a local educational app, not a production security design.

Slides 17–18 are hidden appendices for provider setup and references. The editable deck has speaker notes. The video-inspired sequence is preserved: explain the addition, show the code, then observe the new behavior.
