import { type StackProps } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";
import { QuackStack } from "@quack/cdk";

export interface NetworkStackProps extends StackProps {
  vpcName: string;
}

export class NetworkStack extends QuackStack {
  constructor(scope: Construct, props: NetworkStackProps) {
    super(scope, "QuackNetworkStack", props);

    const subnets = [
      { name: "public", subnetType: SubnetType.PUBLIC },
      { name: "protected", subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      { name: "private", subnetType: SubnetType.PRIVATE_ISOLATED },
    ];

    const vpc = new Vpc(this, "Vpc", {
      vpcName: props.vpcName,
      maxAzs: 2,
      natGateways: 1,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: subnets,
    });

    this.addStackOutput("VpcName", props.vpcName);
    this.addStackOutput("VpcCidr", vpc.vpcCidrBlock);
    for (const { name } of subnets) {
      for (const subnet of vpc.selectSubnets({ subnetGroupName: name }).subnets) {
        this.addStackOutput(subnet.node.id, subnet.ipv4CidrBlock);
      }
    }
  }
}
