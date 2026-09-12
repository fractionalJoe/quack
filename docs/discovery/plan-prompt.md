# Planning session: minimal Slack-like chat on AWS

## Purpose

I am building a small, working Slack-like chat service and publishing it as an instructional repo. The repo is the product: a reader should come away understanding how it works and why it is built the way it is. Documentation describes the system, never the process of building it.
I will provide a design spreadsheet tool that you will assist me in completing ("C:\Users\joe\OneDrive\Documents\PARA\1-Projects\Find a new job\Design Playbook - Snack.xlsx"). You will not complete it but will help establish answers that I will fill in. It has been attached.

## How we work

- I make every decision. At a decision point, give the options in two or three lines each and stop. Never pick for me, never default silently.
- I write or fully understand every line. Default mode is instruction: tell me what to do and what the result should look like. You create files or run commands only when my message contains the word "execute", and only for that message.
- Do not explain rules back to me, restate my reasoning, or add rationale I did not ask for. Short replies.
- Put these working rules in CLAUDE.md so every later session inherits them.

## Output of this session

PLAN.md at the repo root, checkbox style, that we work through.
It is broken into the following phases:

- Discovery - establishing requirements and scope
- Design - establishing the technical approach, infrastructure, services, stacks, data model, and foundational decisions for the solution
  Phased (iterative, incremental delivery)
- Build - implementing the design, with each step ending in a verifiable result
- Delivery - delivering the minimum viable product through to the development account

Within each of these phases, we will break the work into steps. Each step is a single sitting, and ends with something verifiable. The plan is a living document: we can add or remove steps as we go, but we will not change the order of steps within a phase.
Phases should contain time constraints to help gauge progress and scope. Exit criteria for each phase should be clearly stated and verifiable.
Design is complete before any code: a finished design with a non-working repo beats a half built one.

```Example
## Delivery Plan

### Phase 1: Discovery
<Scope description and timebox>
#### Exit Criteria
- <Verifiable criteria for completion of this phase>
-

#### Steps
1.
2.
```

## Requirements

Product

- Sign in with Google via OpenID Connect ID token.
- Channels: create, list, join.
- Send a message to a channel; connected members receive it in real time; recent history loads on channel open.
- A minimal web client sufficient to exercise all of the above from a browser.
- Authorization enforced server side.
- Single hardcoded tenant. Tenant key present in the data model; multi tenancy documented in the design as a future enhancement, not built.
  Stack
- AWS, CDK, TypeScript. Single account, single region.

## Documentation

- Root README: what the project is and guidance for developers an how to navigate the project, plus one sentence disclosing AI assisted development.
- /docs/README.md as the overview page linking the subfolders. /docs/design for architecture, data model, request flows, operational notes, where the design stops scaling and what changes. /docs/adr for decisions. Keep it small.
- ADR format: decision, options considered, the one or two inflection points that made the call. No narrative. Every scope cut and every dependency gets one.

## Constraints

- Timebox: one weekend. When a step threatens it, say so and offer the cut.
- Out of scope: presence, typing indicators, read state, search, file sharing, notifications, threads, message editing, Cognito or any hosted user pool.
- Minimal dependencies.
- Keep it simple. YAGNI.
- Any numeric claim in docs (limits, quotas, latencies) is sourced with a link or omitted.
- No em dashes anywhere in repo text.
