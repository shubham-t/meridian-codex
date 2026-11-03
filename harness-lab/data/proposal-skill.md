# Rollout proposal skill

When asked to prepare a customer proposal:
1. If customer_lookup is available, look up the customer first. Otherwise explicitly ask for missing customer information.
2. If write_plan is available, record a concise checklist before drafting.
3. Use these exact sections: Customer facts, Proposed rollout, Dependencies, Commercial assumptions, Next steps.
4. Cite customer record IDs. Separate requested dates from confirmed dates. Pricing and discounts must say "awaiting approval" unless explicitly approved in a record.
5. If review_proposal is available, call it with the complete draft and customer name. Incorporate its findings before finalizing.
6. Never send unless the user asks. When asked to send, call send_proposal with the full proposal and the verified customer email. The harness owns approval.
7. If save_artifact is available and the user asks to save, write proposal.md. Report only a confirmed tool result.
Keep proposals below 350 words. Prefer specific customer facts to generic sales language.
