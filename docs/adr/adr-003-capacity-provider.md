---
Status: Proposed
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-002-compute.md
---
# ADR-003: ECS capacity provider

## Question Under Consideration
ADR-002 puts the service on ECS. Does Fargate or an EC2 Auto Scaling group supply the capacity? One person builds and runs it (CON-02).

## Decision
ECS tasks run on Fargate.

## Rationale
Fargate removes the Auto Scaling group, AMI updates, agent, and instance draining from a one-person operation. The on-demand price difference at scale is small.

## Options
Criteria are scored 1 to 5 for this context: 1 is highly unfavorable, 3 is neutral, 5 is highly beneficial.

| Option  | Cost at scale | Cost in demo | Time to deliver | Operational burden | Reservation path | Total |
| ------- | ------------- | ------------ | --------------- | ------------------ | ---------------- | ----- |
| Fargate | 4             | 5            | 5               | 5                  | 2                | 21    |
| EC2     | 5             | 3            | 3               | 2                  | 5                | 18    |

### Option 1 - Fargate
Capacity is billed per vCPU-second and GB-second with no instances to manage ([Fargate pricing](https://aws.amazon.com/fargate/pricing/)). Estimate at scale is about $7,300 per month for compute ([calculator estimate 003-A](https://calculator.aws/#/estimate?id=78536578583080d7af0dfc35f0be60dcf8fe3aa2)); the smallest task is about $9 per month for the demo ([calculator estimate 003-C](https://calculator.aws/#/estimate?id=ddbd57869eaec8b9e53c85e30f773cf2c2ba2b0b)). Savings plans exist but do not reach EC2 reserved pricing.

### Option 2 - EC2
Instances in an Auto Scaling group registered to the cluster. Estimate at scale is about $5,400 per month on demand with Graviton instances ([calculator estimate 003-B](https://calculator.aws/#/estimate?id=016129b9fa2b37964faae5be475808625758567c)), and about $2,400 with 3-year reservations ([c7g.xlarge](https://instances.vantage.sh/aws/ec2/c7g.xlarge)). One small instance for the demo is about $53 per month ([calculator estimate 003-D](https://calculator.aws/#/estimate?id=0b10d91409880ef1375f30d90323ca85df5bc838)). Adds AMI updates, the ECS agent, and draining on scale-in.

## Consequences
No instances, AMIs, or Auto Scaling groups in CDK. Task sizing is the only capacity knob. Kernel tuning for very high socket counts is limited to what the task definition exposes.

## Revisit When
After 90 days of production run: size the steady-state capacity, price EC2 reservations against it, and decide whether the saving justifies the operational cost.
