import { Port, SecurityGroup, type ISecurityGroup, type IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import type { ServiceInfo } from "../ducks-service-stack.ts";

interface ServiceSecurityGroupProps {
  vpc: IVpc;
  serviceName: string;
  serviceInfo: ServiceInfo;
  containerPort: number;
}

export class ServiceSecurityGroup extends Construct {
  private readonly serviceInfo: ServiceInfo;
  private readonly vpc: IVpc;
  private readonly depSecurityGroups: DependentSecurityGroups;

  public get albSecurityGroup(): ISecurityGroup {
    return this.depSecurityGroups.alb;
  }

  constructor(scope: Construct, props: ServiceSecurityGroupProps) {
    super(scope, "ServiceSecurityGroup");
    this.vpc = props.vpc;
    this.serviceInfo = props.serviceInfo;
    const securityGroup = new SecurityGroup(this, "ServiceSecurityGroup", {
      vpc: this.vpc,
      description: `${props.serviceName} service: ingress from the load balancer; egress anywhere`,
      allowAllOutbound: true,
    });
    this.depSecurityGroups = this.getSecurityGroups();
    securityGroup.addIngressRule(
      this.depSecurityGroups.alb,
      Port.tcp(props.containerPort),
      "Load balancer",
    );
    this.depSecurityGroups.aurora.addIngressRule(
      securityGroup,
      Port.tcp(5432),
      `${props.serviceName} service`,
    );
    this.depSecurityGroups.valkey.addIngressRule(
      securityGroup,
      Port.tcp(6379),
      `${props.serviceName} service`,
    );
  }

  private getSecurityGroups(): DependentSecurityGroups {
    return {
      aurora: SecurityGroup.fromLookupByName(
        this,
        "AuroraSecurityGroup",
        this.serviceInfo.data.aurora.securityGroupId,
        this.vpc,
      ),
      alb: SecurityGroup.fromLookupByName(
        this,
        "AlbSecurityGroup",
        this.serviceInfo.compute.alb.securityGroupId,
        this.vpc,
      ),
      valkey: SecurityGroup.fromLookupByName(
        this,
        "ValkeySecurityGroup",
        this.serviceInfo.data.valkey.securityGroupId,
        this.vpc,
      ),
    };
  }
}

interface DependentSecurityGroups {
  aurora: ISecurityGroup;
  alb: ISecurityGroup;
  valkey: ISecurityGroup;
}
