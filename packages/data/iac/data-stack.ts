import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AuroraCluster } from "./lib/aurora-cluster.ts";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { QuackStack } from "@quack/cdk";

export interface DataStackProps extends StackProps {
  autoPauseSeconds: number;
  databaseName: string;
  vpcName: string;
}

export class DataStack extends QuackStack {
  constructor(scope: Construct, props: DataStackProps) {
    super(scope, "QuackDataStack", props);

    const vpc = Vpc.fromLookup(this, "Vpc", {
      vpcName: props.vpcName,
    });

    const cluster = new AuroraCluster(this, {
      autoPauseSeconds: props.autoPauseSeconds,
      databaseName: props.databaseName,
      vpc,
    });

    this.addStackOutput("ClusterArn", cluster.clusterArn, "/quack/data/cluster-arn");
    this.addStackOutput("ClusterSecretArn", cluster.secretArn, "/quack/data/secret-arn");
    this.addStackOutput("ClusterEndpoint", cluster.endpoint, "/quack/data/endpoint");
    this.addStackOutput(
      "ClusterSecurityGroupId",
      cluster.clusterSecurityGroupId,
      "/quack/data/security-group-id",
    );
  }
}
