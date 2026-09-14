import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AuroraCluster } from "./lib/aurora-cluster.ts";
import { Port, Vpc } from "aws-cdk-lib/aws-ec2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { QuackStack } from "@quack/cdk";
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

    this.addStackOutput("ClusterArn", cluster.clusterArn, "/quack/data/cluster-arn");
    this.addStackOutput("ClusterSecretArn", cluster.secretArn, "/quack/data/secret-arn");
    this.addStackOutput(
      "ClusterResourceId",
      cluster.resourceIdentifier,
      "/quack/data/cluster-resource-id",
    );
    this.addStackOutput("ClusterEndpoint", cluster.endpoint, "/quack/data/endpoint");
    this.addStackOutput(
      "ClusterSecurityGroupId",
      cluster.clusterSecurityGroup.securityGroupId,
      "/quack/data/security-group-id",
    );
    this.addStackOutput("BastionSecurityGroupId", bastion.securityGroup.securityGroupId);
    this.addStackOutput("ValkeyEndpoint", valkey.endpoint, "/quack/data/valkey-endpoint");
    this.addStackOutput(
      "ValkeySecurityGroupId",
      valkey.securityGroup.securityGroupId,
      "/quack/data/valkey-security-group-id",
    );
  }
}
