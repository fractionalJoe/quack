# Quack

A minimal Slack-like chat service on AWS. Channels are called flocks.

Start at [docs/README.md](docs/README.md).

## Setup

Once per AWS account, before the first workflow run.

1. Create the GitHub OpenID Connect provider and the two GitHub Actions roles. `dev` is the GitHub Environment the workflow deploys to.

   ```
   aws cloudformation deploy \
     --profile ryt.quack.admin \
     --region us-east-1 \
     --stack-name BootstrapIam \
     --template-file packages/infra/BootstrapIam.yaml \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides GitHubOrg=fractionalJoe GitHubRepo=quack GitHubEnvironment=dev
   ```

2. Bootstrap CDK in the account and region: `pnpm infra cdk bootstrap --profile ryt.quack.admin`.

3. In the GitHub repository, create the `dev` environment with one variable, `AWS_DEPLOY_ROLE_ARN`, set to the `DeployRoleArn` output of the BootstrapIam stack. Under the environment's deployment branches rule, allow `main` only; the roles trust the environment, so this rule is what limits deploys to `main`.

This project was built with AI-assisted development.
