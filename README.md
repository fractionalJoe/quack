# Quack

A minimal Slack-like chat service on AWS. Channels are called flocks.

Start at [docs/README.md](docs/README.md).

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

## Local database access

The cluster sits in private subnets. A bastion host in the data stack forwards a local port to it through Session Manager. Run this and leave it open, then connect to `localhost:5432`.

```
aws ssm start-session --profile ryt.quack.admin --region us-east-1 \
  --target i-03f0151c2c09e67cf \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters host=quackdatastack-auroraclusterd4efe71c-w8f0swlz2sfh.cluster-cyv0k6sauhlc.us-east-1.rds.amazonaws.com,portNumber=5432,localPortNumber=5432
```

The bastion ID is the `BastionInstanceId` output of the data stack and the host is its `ClusterEndpoint` output; both change on a redeploy.

This project was built with AI-assisted development.
