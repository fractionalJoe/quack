# Quack

A minimal Slack-like chat service on AWS, built to show the architecture and implementation of a real-time messaging service end to end: infrastructure as code, a few small domain services, live delivery over WebSockets, and a decision record for every choice that shaped it.

## Overview

Users sign in with Google, join flocks (channels) inside a pond (tenant), and exchange messages that arrive live over a WebSocket.

**How it runs**

- Node services on ECS Fargate behind one Application Load Balancer: `ducks` (users, sign-in, socket tickets), `flocks` (channels and membership), `messages` (send and history), and `websocket` (live delivery).
- Aurora PostgreSQL Serverless v2 holds every entity. Row-level security enforces pond isolation and flock membership on every query.
- ElastiCache Valkey pub/sub fans messages out between tasks.
- A static web client on S3 behind CloudFront.
- Google Sign-In issues the OpenID Connect ID token that every service verifies in code. No passwords are stored anywhere; database connections use IAM authentication.

Every stack deploys with CDK from GitHub Actions through OpenID Connect, so no long-lived AWS credentials exist in the repository or in GitHub.

**Repository layout**

| Path                | Contents                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| `packages/infra`    | VPC and subnets, plus the bootstrap IAM template for GitHub Actions         |
| `packages/data`     | Aurora cluster, Valkey node, bastion host                                   |
| `packages/compute`  | ECS cluster and load balancer                                               |
| `packages/libs`     | Shared code: CDK base stack, database schema, config and token verification |
| `docs/design`       | Architecture, data model, request flows, operational design                 |
| `docs/adr`          | Decision records                                                            |
| `docs/discovery`    | Delivery plan and design playbook                                           |
| `.github/workflows` | Deploy pipeline                                                             |

Start at [docs/README.md](docs/README.md) for the full design. Progress against the plan is tracked in [docs/discovery/PLAN.md](docs/discovery/PLAN.md).

## Setup

Once per AWS account, before the first workflow run.

1. Create the GitHub OpenID Connect provider and the two GitHub Actions roles. `dev` is the GitHub Environment the workflow deploys to. The repository ID comes from `gh api repos/fractionalJoe/quack --jq .id`; GitHub puts it in the OpenID Connect subject the roles trust.

   ```
   aws cloudformation deploy \
     --profile ryt.quack.admin \
     --region us-east-1 \
     --stack-name BootstrapIam \
     --template-file packages/infra/BootstrapIam.yaml \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides GitHubRepo=quack GitHubRepoId=1367449169 GitHubEnvironment=dev
   ```

2. Bootstrap CDK in the account and region: `pnpm infra cdk bootstrap --profile ryt.quack.admin`.

3. In the GitHub repository, create the `dev` environment with two variables from the BootstrapIam stack outputs: `AWS_DEPLOY_ROLE_ARN` set to `DeployRoleArn` and `AWS_MIGRATE_ROLE_ARN` set to `MigrateRoleArn`. Under the environment's deployment branches rule, allow `main` only; the roles trust the environment, so this rule is what limits deploys to `main`.

4. On the machine used for local development, install the Session Manager plugin for the AWS CLI. It opens the port-forwarding session to the bastion host that reaches the database ([Install the Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)). On Ubuntu and WSL:

   ```
   curl -o session-manager-plugin.deb https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb
   sudo dpkg -i session-manager-plugin.deb
   session-manager-plugin --version
   ```

5. On the same machine, resolve the cluster hostname to the tunnel. IAM tokens and the TLS certificate are bound to the cluster hostname, so local connections use it too. On WSL the entry goes in the Windows hosts file, which WSL copies into `/etc/hosts` at each start. In PowerShell as administrator, then reopen the terminal. The hostname is the `ClusterEndpoint` output of the data stack and changes on a redeploy.

   ```
   Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "127.0.0.1 quackdatastack-auroraclusterd4efe71c-w8f0swlz2sfh.cluster-cyv0k6sauhlc.us-east-1.rds.amazonaws.com"
   wsl --shutdown
   ```

## Local database access

The cluster sits in private subnets. A bastion host in the data stack forwards a local port to it through Session Manager. Run this and leave it open, then connect to the cluster hostname on port 5432; the hosts entry from Setup resolves it to the tunnel.

```
aws ssm start-session --profile ryt.quack.admin --region us-east-1 \
  --target i-03f0151c2c09e67cf \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters host=quackdatastack-auroraclusterd4efe71c-w8f0swlz2sfh.cluster-cyv0k6sauhlc.us-east-1.rds.amazonaws.com,portNumber=5432,localPortNumber=5432
```

The bastion ID is the `BastionInstanceId` output of the data stack and the host is its `ClusterEndpoint` output; both change on a redeploy.

This project was built with AI-assisted development.
