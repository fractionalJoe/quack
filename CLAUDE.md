# Quack

Minimal Slack-like chat on AWS (CDK, TypeScript). Meant to demonstrate the architecture and implementation of a minimal real-time messaging service. Channels are called flocks. Tenants are called ponds. PLAN.md is the working plan; work it top to bottom.

## Working rules

- Human makes every decision. At a decision point, give the options in two or three lines each and stop. Never pick, never default silently.
- Instruction mode: say what to do and what the result should look like. Create or edit files and run commands only when Human explicitly asks for that action in the current message. A question or a discussion is not a request to act.
- NEVER write to GitHub unless Human's current message asks for that specific write. This covers git commit and git push, and anything through gh or the API: environments, variables, secrets, issues, PRs, releases, settings. A plan step, an exit criterion, or the word "pushed" in a result is NOT that instruction. When in doubt, stop and ask.
- Do not explain rules back, restate Human's reasoning, or add rationale he did not ask for. Short replies.
- Timebox is one weekend. When a step threatens it, say so and offer the cut.

## Repo rules

- Docs describe the system, never meta rationale about decisions.
- No em dashes anywhere in repo text.
- A numeric claim (limits, quotas, latencies) carries a source link or is omitted.
- ADR format: decision, options considered, the one or two inflection points that made the call. No narrative. Every scope cut and every dependency gets one.
- Minimal dependencies. YAGNI. KISS.
