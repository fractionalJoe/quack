import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AuroraCluster } from "./lib/aurora-cluster.ts";
import { Port, Vpc } from "aws-cdk-lib/aws-ec2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { QuackStack } from "@quack/cdk";
import { parameters } from "@quack/shared";
import { BastionHost } from "./lib/bastion-host.ts";
import { ValkeyNode } from "./lib/valkey-node.ts";

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

    const bastion = new BastionHost(this, {
      vpc,
      auroraSecurityGroup: cluster.clusterSecurityGroup,
    });

    cluster.clusterSecurityGroup.addIngressRule(
      bastion.securityGroup,
      Port.tcp(5432),
      "Allow ingress from bastion host",
    );

    const valkey = new ValkeyNode(this, { vpc });

    this.addStackOutput("ClusterArn", cluster.clusterArn, parameters.data.clusterArn);
    this.addStackOutput("ClusterSecretArn", cluster.secretArn, parameters.data.secretArn);
    this.addStackOutput(
      "ClusterResourceId",
      cluster.resourceIdentifier,
      parameters.data.clusterResourceId,
    );
    this.addStackOutput("ClusterEndpoint", cluster.endpoint, parameters.data.endpoint);
    this.addStackOutput(
      "ClusterSecurityGroupId",
      cluster.clusterSecurityGroup.securityGroupId,
      parameters.data.securityGroupId,
    );
    this.addStackOutput("BastionSecurityGroupId", bastion.securityGroup.securityGroupId);
    this.addStackOutput("ValkeyEndpoint", valkey.endpoint, parameters.data.valkeyEndpoint);
    this.addStackOutput(
      "ValkeySecurityGroupId",
      valkey.securityGroup.securityGroupId,
      parameters.data.valkeySecurityGroupId,
    );
  }
}
