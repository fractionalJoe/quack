import { App } from "aws-cdk-lib";
import { config } from "@quack/shared";
import { InfraStack } from "./infra-stack.ts";

const account = process.env.CDK_DEFAULT_ACCOUNT;
if (!account) throw new Error("CDK_DEFAULT_ACCOUNT is not set; run with AWS credentials");

const app = new App();
new InfraStack(app, "quack-infra", {
  env: { account, region: config.primary.region },
  vpcName: config.primary.vpcName,
});
