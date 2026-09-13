import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AuroraCluster } from "./lib/aurora-cluster.ts";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export interface DataStackProps extends StackProps {
  autoPauseSeconds: number;
  databaseName: string;
  vpcName: string;
}

export class DataStack extends Stack {
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

    this.addOutput("ClusterArn", cluster.clusterArn, "/quack/data/cluster-arn");
    this.addOutput(
      "ClusterSecretArn",
      cluster.secretArn,
      "/quack/data/secret-arn",
    );
    this.addOutput("ClusterEndpoint", cluster.endpoint, "/quack/data/endpoint");
    this.addOutput(
      "ClusterSecurityGroupId",
      cluster.clusterSecurityGroupId,
      "/quack/data/security-group-id",
    );
  }

  private addOutput(
    logicalName: string,
    value: string,
    parameterName?: string,
  ): void {
    new CfnOutput(this, logicalName, { value });
    if (parameterName) {
      new StringParameter(this, `${logicalName}Param`, {
        parameterName,
        stringValue: value,
      });
    }
  }
}
