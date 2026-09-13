# Quack Delivery Plan

Quack is a minimal Slack-like chat service on AWS. Channels are called flocks.

Timebox: Saturday 2026-09-12 and Sunday 2026-09-13. Phase budgets are working hours. When a step threatens its budget, the cut is named and decided before continuing.

Discovery, Design, and the Build environment step are complete; [PLAN.original.md](PLAN.original.md) records them. This plan carries the remaining work as slices: each slice builds one part of the system and deploys it through the GitHub Actions workflow before the next begins.

Each step is one sitting and ends with the result named on it. Steps may be added or removed. Order within a phase does not change. A step is checked when its result is verified.

The design playbook workbook is the discovery tool: [Design Playbook - Quack.xlsx](<Design Playbook - Quack.xlsx>). The docs carry what the design needs from it.

## Phase 3: Build

Implement the design as deployed slices. Sunday, 12 hours.

### Exit Criteria

- [ ] Every product requirement is demonstrable in a browser against the dev account.
- [ ] Authorization negative cases are verified server side.
- [ ] Docs and ADRs match the built system.

### Steps

1. [x] Infra: root TypeScript config, config.json read by CDK, infra package and stack (VPC, public and private subnets, NAT gateway), GitHub Environment dev holding the deploy role ARN, GitHub Actions workflow assuming the deploy role through OIDC, first deploy through the workflow. Each later slice adds its own package. Result: the infra stack is in CloudFormation, deployed by the workflow; cdk diff is clean.
2. [ ] Data: data package and stack (Aurora Serverless v2 with the Data API, subnet group, security group, SSM parameters under /quack/data/), Drizzle schema, security SQL migration (roles, is_member and is_owner, policies, grants), migrate job assuming the migrate role, shared package with data access (pool, IAM token, transaction settings). Result: the migrate job passes in the workflow.
3. [ ] Cluster: cluster stack (ECS cluster, load balancer, HTTPS listener, certificate), fanout stack (Valkey node, subnet group, security group), Cloudflare validation and api CNAME records. Result: https://api.quack.ryt.dev answers with the listener's default response over a valid certificate; both stacks are in CloudFormation.
4. [ ] Ducks: shared token module, fastify verify-and-resolve hook, request log line, shared service construct (task definition, service, target group, listener rule, log group, database role and grants), ducks service (PUT and GET /ducks/me, GET /ducks) and stack. Result: a request with a valid ID token upserts and returns the duck; invalid and expired tokens get 401.
5. [ ] Flocks: flocks service and stack: create, list, add member, delete. Result: curl walkthrough creates, lists, adds a member, and deletes; only the owner can delete; rules from flows/README.md hold.
6. [ ] Messages: messages service and stack: send with publish to the flock topic, history. Result: a sent message persists; history returns the latest 50 newest first; non-member send and read get 403.
7. [ ] Real-time: tickets route on ducks, websocket service (redeem ticket, subscribe per flock, push, ping and pong, close at token expiry, unsubscribe on close), websocket stack, /ws listener rule. Result: two wscat sessions; a message from one arrives at the other; a non-member session receives nothing.
8. [ ] Load test: k6 script against the HTTP API and the live path with a captured ID token. Result: latency, freshness, and error-rate figures recorded against SC-01 to SC-07; autoscaling observed.
9. [ ] Web client: React app with Google sign-in, flock list, create and delete, add member, history, live updates, token refresh; web stack (S3 bucket, CloudFront distribution, certificate), Cloudflare records. Result: two browser sessions at https://quack.ryt.dev exchange messages.
10. [ ] Hardening: input validation, error responses, authorization negative-path checklist. Result: checklist passes.
11. [ ] Docs alignment: README walkthrough, docs updated to the built system, ADRs for any deviation from the design. Result: docs describe what runs.

Cut candidates if the budget is threatened (decided at the time, not now): web client scope beyond the required flows, hardening beyond authorization checks, the request log line.

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

## Estimation

**2026-09-13** Bottom-up estimate of the slices above. One sitting per step; the first deploy of each new kind of thing (the Actions workflow, the migrate job, IAM database authentication from a task, WebSockets through the load balancer) is where a step goes over.

| Step                     | Work                                                                                                                                                                                  | Hours | Actual |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| Phase 1 Discovery        | Design playbook sheets: brief, scoping, requirements, entities and access patterns, scale, decision log                                                                               | 2     | 5.25   |
| Phase 2 Design           | Architecture, data model, flows, operational design, ADRs 001 to 012                                                                                                                  | 3     | 7.5    |
| 3.1 Bootstrap (original) | Account bootstrap template, OIDC provider and deploy role, CDK bootstrap, Google OAuth client                                                                                         | 1     |        |
| 3.1 Infra                | Root TypeScript config, config reader, infra package and stack, Actions workflow with OIDC, first deploy through the workflow                                                         | 2     | 2.25   |
| 3.2 Data                 | Data package and stack with Data API and SSM parameters, Drizzle schema, security SQL, migrate job, shared package with data access, RLS settings and IAM auth                       | 4     |        |
| 3.3 Cluster              | Cluster stack with ALB and certificate, fanout stack, Cloudflare records                                                                                                              | 2     |        |
| 3.4 Ducks                | Token module, fastify hook, log line, service construct, ducks service and stack, IAM database authentication from a task                                                             | 3     |        |
| 3.5 Flocks               | Service, stack, curl walkthrough                                                                                                                                                      | 1.5   |        |
| 3.6 Messages             | Service, stack, publish                                                                                                                                                               | 1.5   |        |
| 3.7 Real-time            | Ticket route, websocket service, subscriptions, close at expiry, /ws rule, stack, wscat test                                                                                          | 3     |        |
| 3.8 Load test            | k6 script for HTTP and sockets, run, record against SC-01 to SC-07                                                                                                                    | 2     |        |
| 3.9 Web client           | React app, Google sign-in, every flow, web stack, certificate, Cloudflare records                                                                                                     | 4     |        |
| 3.10 Hardening           | Validation, error responses, negative-path checklist                                                                                                                                  | 1     |        |
| 3.11 Docs alignment      | README walkthrough, doc updates, deviation ADRs                                                                                                                                       | 1.5   |        |
| 4.1 Clean deploy         | Destroy, redeploy from the README, fix what it misses                                                                                                                                 | 1.5   |        |
| 4.2 Smoke checklist      | Every item plus the load test rerun                                                                                                                                                   | 1     |        |
| 4.3 Publish              | Greps, checks, visibility                                                                                                                                                             | 0.5   |        |
| Total                    |                                                                                                                                                                                       | 34.5  |        |

Each step carries about plus or minus 30 percent.
