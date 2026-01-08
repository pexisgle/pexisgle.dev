---
trigger: always_on
---

# Very Important Rules

These are extremely important rules that must be strictly followed.
Under no circumstances is breaking these rules permitted.
Please ensure you are adhering to these rules at all times.

## Language Rule

- Always think in English
- ユーザが見るものはすべて日本語で対応してください
- implementation planやTaskなども日本語で対応してください

## disabling linting

Warnings that can be suppressed by commenting out are generally not permitted.
Only warnings for `state_referenced_locally` in `data.form` within sveltekit-supreforms are permitted.

## Code Checking

- After adding functionality, always format your code (run `bun run format`)
- then run `bun run check` and `bun run lint` to verify there are no errors.
- If errors are found, carefully review the modified code sections and proceed with corrections.
