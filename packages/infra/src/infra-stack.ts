import { Stack, type StackProps } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";

export interface InfraStackProps extends StackProps {
  vpcName: string;
}

export class InfraStack extends Stack {
  constructor(scope: Construct, props: InfraStackProps) {
    super(scope, "QuackInfraStack", props);

    new Vpc(this, "Vpc", {
      vpcName: props.vpcName,
      maxAzs: 2,
      natGateways: 1,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        { name: "public", subnetType: SubnetType.PUBLIC },
        { name: "protected", subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        { name: "private", subnetType: SubnetType.PRIVATE_ISOLATED },
      ],
    });
  }
}
