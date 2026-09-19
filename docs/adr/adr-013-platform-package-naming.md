---
Status: Accepted
Created: 2026-09-19
Decided: 2026-09-19
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-007-stack-layout.md
---

# ADR-013: Platform package naming

## Question Under Consideration

What are the shared infrastructure packages called, and where does the account bootstrap template live? The three packages that hold only CDK code (VPC, data stores, ECS cluster and load balancer) sat in `packages/stacks`, and the VPC package was named `infra`. Every deployable owns a stack, so `stacks` does not distinguish these three from the services. `infra` held two unrelated things: the VPC stack, and `BootstrapIam.yaml`, a standalone CloudFormation template applied once per account that no stack references.

## Decision

- The folder is `packages/platform`: the shared tier that services and the web client run on, with no application code, depended on by every deployable and depending on none.
- The VPC package and stack are `network` (`@quack/network`, `QuackNetworkStack`).
- `BootstrapIam.yaml` sits at `packages/platform/BootstrapIam.yaml`, outside any package.
- A new shared resource gets its own platform package; `network` holds the VPC and nothing else.
- The deployed stack is renamed with the code, by tearing down the dev environment and redeploying it through the workflow.

## Rationale

A name that states one responsibility stops the package from collecting unrelated resources; `infra` already had, and `foundation` would have invited the same. The bootstrap template contains the IAM resources needed to deploy CDK stacks, so it belongs to the tier and not to any one CDK stack. Renaming only the code would leave the repo and CloudFormation disagreeing about the stack's name for the life of the project, and dev holds nothing that a redeploy does not restore.

## Options

Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option                                       | Name accuracy | Resists catch-all growth | Cost of change | Total |
| -------------------------------------------- | ------------- | ------------------------ | -------------- | ----- |
| Keep `stacks` and `infra`                    | 2             | 2                        | 5              | 9     |
| `platform` and `foundation`                  | 4             | 2                        | 2              | 8     |
| `platform` and `network`, template moved out | 5             | 5                        | 2              | 12    |

### Option 1 - Keep `stacks` and `infra`

No work. `stacks` describes every package that deploys, and `infra` stays the default home for anything shared.

### Option 2 - `platform` and `foundation`

`foundation` covers both the VPC and the bootstrap template as things laid first. It is broad enough that any basic shared resource fits it, which is the growth the rename is meant to prevent. `core` was considered for the folder and dropped: it reads as central code and collides with `packages/libs`.

### Option 3 - `platform` and `network`, template moved out

Each name states one thing. The template moves up a level because it serves the whole tier. For the stack name, a code-only rename avoids a redeploy but leaves `QuackInfraStack` in CloudFormation, and [CloudFormation stack refactoring](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stack-refactoring.html) avoids the teardown but is untried here; teardown and redeploy is slower with known failure modes.

## Consequences

The repo has four package groups: `platform`, `services`, `libs`, and the web client at `packages/web`.

### Documentation Updates

- ADR-007: the stack it calls infra, "network and shared structural resources", is the network stack; the bootstrap template belongs to no stack.
- `architecture.md`: the stack table lists network in place of infra, without shared parameters and roles (none exist in this stack); data and compute depend on network.
- `operational-design.md`: the deploy order diagram and the bootstrap template path use the new names.
- `README.md`: the layout table lists every package; setup uses the new template path and `pnpm network`.

### Workflow and Environment

- `deploy.yml`: the job, dispatch input, and path filters are network; an edit to the bootstrap template no longer triggers a deploy.
- The dev environment is rebuilt from empty: the database starts empty and every migration replays, and the Cloudflare api record points at the new load balancer.

## Revisit When

A shared resource appears that has no dependencies and no natural package of its own, such as account-wide roles or parameters managed by CDK: decide its package then, not by widening `network`.
