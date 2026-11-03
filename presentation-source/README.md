# Optional deck authoring source

The existing `Agent-Harness-Workshop.pptx` is fully editable in PowerPoint. These scripts are included to preserve the authoring source, not as dependencies of the Python demo.

`build.mjs` creates the 18-slide deck and PNG renders using `@oai/artifact-tool`. `animate.py` adds standard fade transitions and click builds. `finalize.mjs` uses the Codex presentation skill's validation/export helpers. Paths are relative to the repository; temporary output goes into ignored `work/presentation/`.

To regenerate, use an approved Codex presentation authoring environment. Read its current presentation skill and discover the bundled runtime. Ensure `@oai/artifact-tool` is importable by Node. Do not assume it is a public npm dependency or install unverified packages. The Python demo itself needs none of this.

Run from the repository root, with approved runtime executables on PATH:

```text
node presentation-source/build.mjs
python presentation-source/animate.py
node presentation-source/finalize.mjs
```

Before finalization set `PRESENTATIONS_SKILL_DIR` to the current presentation skill directory, `RUNTIME_NODE_MODULES` to its bundled Node modules directory, `RUNTIME_NODE` to the Node executable, and `PYTHON_EXECUTABLE` to Python. The script creates `work/presentation/Agent-Harness-Workshop.rebuilt.pptx` and a validation receipt; it deliberately leaves the delivered deck untouched. Inspect all rendered slides and test native PowerPoint playback before replacing the delivered deck.

The deck was originally generated and validated using the bundled runtime. The supplied scripts have portable path adjustments and syntax checks; the complete regeneration pipeline has not been rerun after those path-only adjustments. The historical validation evidence applies to the delivered PPTX hash, not to a future rebuild.
