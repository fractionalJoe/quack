# Quack Delivery Plan

Quack is a minimal Slack-like chat service on AWS. Channels are called flocks.

Timebox: Saturday 2026-09-12 and Sunday 2026-09-13. Phase budgets are working hours. When a step threatens its budget, the cut is named and decided before continuing.

Each step is one sitting and ends with the result named on it. Steps may be added or removed. Order within a phase does not change. A step is checked when its result is verified.

The design playbook workbook is the discovery tool: [Design Playbook - Quack.xlsx](<Design Playbook - Quack.xlsx>). The docs carry what the design needs from it.

## Phase 1: Discovery

Establish requirements, scope, and scale by completing the design playbook sheets. Saturday morning, 2 hours. Actual: 5 hours 19 minutes.

### Exit Criteria

- [x] Design Brief, Scoping Questions, Requirements, and Scale and Estimates sheets are complete: every row or question has an answer or an explicit N/A with a reason.
- [x] Scale and Estimates shows no "Missing Info" in the Calculated block and every input names its source or assumption.
- [x] Every out of scope item and every external dependency is listed with a reason. Each becomes an ADR in Design.

### Steps

1. [x] Design Brief sheet: problem statement, business value, personas, workflows, dependencies, success criteria, constraints, assumptions, out of scope, risks. Single-person sections (stakeholders, responsible parties, budget) filled as such. Result: no empty section.
2. [x] Scoping Questions sheet: answer every question. Result: no empty Answer cell.
3. [x] Requirements sheet: functional, non-functional, data entities and access patterns, future considerations. Result: every product requirement is an FR with a priority; every entity has at least one access pattern with a frequency; multiple ponds is a future consideration.
4. [x] Scale and Estimates sheet: fill every input with a source or stated assumption. Result: Calculated block fully populated.

## Phase 2: Design

Establish the technical approach and record every decision before any code exists. Saturday late morning, 3 hours. At each decision point the options are presented, Joe decides, and an ADR records it.

### Exit Criteria

- [ ] docs/design holds architecture, data model, request flows, and operations (including where the design stops scaling and what changes), each complete for the MVP.
- [ ] Every scope cut and every dependency has an ADR in docs/adr in the agreed format.
- [ ] Decision Log sheet lists every expensive-to-reverse decision with a link to its ADR.
- [ ] No application code exists. Every numeric claim in docs carries a source link.
- [ ] Design docs are pushed to the GitHub remote.

### Steps

1. [x] Repo skeleton: git init, .gitignore, README stub with the AI-assisted development sentence, docs/README.md, docs/design/, docs/adr/ with the ADR template, GitHub remote, first push. Result: the remote shows the skeleton.
2. [x] Architecture: decide compute, HTTP API, real-time transport, web client hosting, Google ID token verification, WebSocket authentication, and stack layout. Result: docs/design/architecture.md with a component diagram and the pond note; one ADR per decision.
3. [x] Data model: entities and access patterns from the Requirements sheet, table design, keys, pond key. Result: docs/design/data-model.md; ADR for the data store.
4. [x] Request flows: sign-in, create flock, list flocks, add member, delete flock, send message with fan-out, history load, connect and disconnect, each with its authorization check. Result: docs/design/flows/, one file per flow with a sequence diagram.
5. [ ] Operations and scaling: deploy method, configuration and secrets, logging, cost from the Scale sheet, scaling limits with sourced quotas and what changes, multiple ponds as the named future enhancement. Result: docs/design/operations.md; ADRs for deploy method and each dependency.
6. [ ] Decision Log and ADR sweep: fill the Decision Log sheet; confirm every out of scope item (presence, typing indicators, read state, search, file sharing, notifications, threads, message editing, hosted user pools) and every dependency has an ADR. Result: docs/README.md links everything; pushed.

## Phase 3: Build

Implement the design, deploying to the dev account as each step completes. Saturday afternoon and Sunday, 12 hours.

### Exit Criteria

- [ ] Every product requirement is demonstrable in a browser against the dev account.
- [ ] Authorization negative cases are verified server side.
- [ ] Docs and ADRs match the built system.

### Steps

1. [ ] Environment: AWS dev account credentials on this machine, region chosen, CDK bootstrapped, Google Cloud project with an OAuth web client ID, client ID stored where architecture.md says. Result: caller identity shows the dev account, CDKToolkit stack exists, the parameter reads back.
2. [ ] Scaffold: workspace layout per architecture.md, TypeScript config, CDK app with empty stack(s), deployed. Result: stack(s) in CloudFormation; cdk diff is clean.
3. [ ] Data layer: table(s) per data-model.md in CDK; data access module covering every access pattern. Result: a script exercises each access pattern against the deployed table.
4. [ ] Sign-in: Google ID token verification, authorizer, user record upsert. Result: a request with a valid ID token succeeds; invalid and expired tokens get 401.
5. [ ] Flocks: create, list, add member, delete. Result: curl walkthrough creates, lists, adds a member, and deletes; only the creator can delete; rules from request-flows.md hold.
6. [ ] Messages: send and history. Result: a sent message persists; history returns recent messages in order; non-member send and read are rejected.
7. [ ] Real-time: WebSocket connect with authentication, disconnect cleanup, fan-out on send. Result: two wscat sessions; a message from one arrives at the other; a non-member session receives nothing.
8. [ ] Load test: k6 script against the HTTP API and the live path with a captured ID token. Result: latency, freshness, and error-rate figures recorded against SC-01 to SC-07; autoscaling observed.
9. [ ] Web client: sign in, list, create, and delete flocks, add members, message history, live updates. Result: two browser sessions exchange messages.
10. [ ] Hardening: input validation, error responses, structured logs, authorization negative-path checklist. Result: checklist passes.
11. [ ] Docs alignment: README walkthrough, docs updated to the built system, ADRs for any deviation from the design. Result: docs describe what runs.

Cut candidates if the budget is threatened (decided at the time, not now): web client scope beyond the required flows, hardening beyond authorization checks, structured logging.

## Phase 4: Delivery

Prove the MVP deploys to the dev account from the repo alone and publish the repo. Sunday evening, 2 hours.

### Exit Criteria

- [ ] The dev account runs the MVP deployed by following the README only.
- [ ] The smoke checklist passes on that deployment.
- [ ] Repo checks pass and the repo is public.

### Steps

1. [ ] Clean deploy: destroy the dev stacks and redeploy following only the README. Result: fresh deployment with no step outside the README.
2. [ ] Smoke checklist on the fresh deployment: sign in, create and list a flock, add a member, send, receive live in a second session, history on open, delete a flock, load test rerun. Result: every item passes, recorded here.
3. [ ] Publish: remove plan-prompt.md; grep for em dashes and for learning, practice, and interview references; confirm numeric claims are sourced and the AI disclosure sentence is present; decide visibility; push. Result: repo public at its final URL.
