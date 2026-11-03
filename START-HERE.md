# Meridian: from chatbot to agent

A 45-minute workshop for engineers and managers. The fictional Meridian Systems team prepares customer rollout proposals while you add eight harness layers. Every live response comes from the configured model. Company records and outbox actions are synthetic.

## Open these files

- `AGENT-HANDOFF.md`: context and exact setup/migration instructions for an agent on your organization laptop; use `harness-lab/.env.internal.example` there.

- `Agent-Harness-Workshop.pptx`: 18 editable slides, including two hidden reference slides; speaker notes, fade transitions, and click builds on the agent loop and persistence slides.
- `PRESENTER-RUNBOOK.md`: the timed talk track and demo cues.
- `harness-lab/README.md`: setup, provider configuration, architecture, and troubleshooting.
- `TEST-RESULTS.md`: what was tested with Sonnet 5.5, what was tested deterministically, and the remaining environment checks.
- `session-assets/`: generated cover art and a screenshot of the working demo.

## Start the demo

1. Extract the entire ZIP to a local folder. Use Python 3.10 or later; no pip packages are needed.
2. In `harness-lab`, copy `.env.example` to `.env` and enter your key locally. The extracted ZIP never includes a key. The working copy on the original machine already has the key you supplied.
3. Double-click `harness-lab/start.bat` on Windows, or run `python server.py` from that folder. On macOS/Linux use `sh start.sh` with Python 3 installed.
4. Open **http://127.0.0.1:8765/** and click **Test connection**. This makes a real, billable model call.
5. Choose **00 Chatbot**, enable **Focus demo**, and open the PowerPoint in Slide Show / Presenter View.

Use **Reveal code → Try it live → Use this prompt → Send** for each layer. The code dialog reads the actual Python source. Arrows navigate layers; C opens code; N shows presenter notes. Stage and role changes start a fresh task. Use Saved tasks to restore persisted work.

The demo has animated stage changes, code reveals, active execution nodes, incoming events, loading indicators, and a reduced-motion option. No external fonts or CDN assets are required. Model access requires a working network connection.

## Before presenting

Run the connection check and rehearse the approval and persistence steps on the presentation laptop. Confirm PowerPoint's animations in Slide Show mode; native PowerPoint playback has not been checked here. Run the internal endpoint smoke test after switching providers. The local app is a teaching harness, not a multi-user production deployment.

Inspired by Aish Reganti's [step-by-step harness video](https://www.youtube.com/watch?v=mv9kfF_kJd0) and its [companion guide](https://github.com/aishwaryanr/awesome-generative-ai-guide/blob/main/youtube/build-your-own-harness.md). This workshop uses an original fictional workflow and adds explicit evaluation and testing.
