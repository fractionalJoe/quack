import { SecurityGroup, SubnetType, type IVpc } from "aws-cdk-lib/aws-ec2";
import { CfnReplicationGroup, CfnSubnetGroup } from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";

interface ValkeyNodeProps {
  vpc: IVpc;
}

export class ValkeyNode extends Construct {
  private readonly group: CfnReplicationGroup;
  public get endpoint(): string {
    return this.group.attrPrimaryEndPointAddress;
  }
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, props: ValkeyNodeProps) {
    super(scope, "Valkey");

    const subnetGroup = new CfnSubnetGroup(this, "SubnetGroup", {
      description: "Valkey: private subnets",
      subnetIds: props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED }).subnetIds,
    });

    this.securityGroup = new SecurityGroup(this, "SecurityGroup", {
      vpc: props.vpc,
      description: "Valkey: ingress on 6379 from services; no egress",
      allowAllOutbound: false,
    });

    this.group = new CfnReplicationGroup(this, "Group", {
      replicationGroupDescription: "Quack fan-out",
      engine: "valkey",
      engineVersion: "9.1",
      cacheNodeType: "cache.t4g.micro",
      numCacheClusters: 1,
      cacheSubnetGroupName: subnetGroup.ref,
      automaticFailoverEnabled: false,
      securityGroupIds: [this.securityGroup.securityGroupId],
      transitEncryptionEnabled: true,
      atRestEncryptionEnabled: true,
    });
  }
}
