import { App } from "aws-cdk-lib";
import { config } from "@quack/shared";
import { DataStack } from "./data-stack.ts";

const account = process.env.CDK_DEFAULT_ACCOUNT;
if (!account) throw new Error("CDK_DEFAULT_ACCOUNT is not set; run with AWS credentials");

const app = new App();
new DataStack(app, {
  env: { account, region: config.primary.region },
  autoPauseSeconds: config.primary.auroraCluster.autoPauseSeconds,
  databaseName: config.primary.auroraCluster.defaultDatabaseName,
  vpcName: config.primary.vpcName,
});
