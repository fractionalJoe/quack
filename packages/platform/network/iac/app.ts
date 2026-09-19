import { App } from "aws-cdk-lib";
import { config } from "@quack/shared";
import { NetworkStack } from "./network-stack.ts";

const account = process.env.CDK_DEFAULT_ACCOUNT;
if (!account) throw new Error("CDK_DEFAULT_ACCOUNT is not set; run with AWS credentials");

const app = new App();
new NetworkStack(app, {
  env: { account, region: config.primary.region },
  vpcName: config.primary.vpcName,
});
