import {
  AmazonLinuxCpuType,
  BastionHostLinux,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  type ISecurityGroup,
  type IVpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface BastionHostProps {
  vpc: IVpc;
  auroraSecurityGroup: ISecurityGroup;
}

export class BastionHost extends Construct {
  public readonly securityGroup: ISecurityGroup;

  constructor(scope: Construct, props: BastionHostProps) {
    super(scope, "BastionHost");

    this.securityGroup = new SecurityGroup(this, "BastionSg", {
      vpc: props.vpc,
      description: "Bastion: egress 443 (SSM + packages), 53 (DNS), 5432 (Aurora)",
      allowAllOutbound: false,
    });
    this.securityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(443), "SSM endpoints + HTTPS repos");
    this.securityGroup.addEgressRule(Peer.anyIpv4(), Port.udp(53), "DNS");
    this.securityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(53), "DNS over TCP");
    this.securityGroup.addEgressRule(props.auroraSecurityGroup, Port.tcp(5432), "Aurora");

    new BastionHostLinux(this, "Bastion", {
      vpc: props.vpc,
      subnetSelection: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.NANO),
      machineImage: MachineImage.latestAmazonLinux2023({
        cpuType: AmazonLinuxCpuType.ARM_64,
      }),
      securityGroup: this.securityGroup,
      requireImdsv2: true,
    });
  }
}
