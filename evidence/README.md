# Historical validation evidence

`live-validation-anthropic.json` records the original eight-stage run using real `claude-sonnet-5-5` calls. Its answers contain only synthetic company/customer data. Stage call/token totals were captured before the additional approval continuation or compaction steps; do not treat them as the total cost of the entire test run. A provenance note was added for this handoff.

`presentation-validation.json` contains selected fields from the original presentation finalization receipt, with machine-specific runtime paths removed. The hash identifies the delivered PowerPoint. It does not claim native PowerPoint playback was tested.

Read `../TEST-RESULTS.md` for what the evidence establishes and what it does not. The organization's gateway has not been tested. Preserve these historical records and record new internal-model validation separately in a local ignored report. Do not commit internal addresses, credentials, or sensitive traces.
