import { Port, SecurityGroup, type ISecurityGroup, type IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { parameters } from "@quack/shared";

interface ServiceSecurityGroupProps {
  vpc: IVpc;
  serviceName: string;
  containerPort: number;
}

export class ServiceSecurityGroup extends Construct {
  public readonly depSecurityGroups: DependentSecurityGroups;
  public readonly securityGroup: ISecurityGroup;

  constructor(scope: Construct, props: ServiceSecurityGroupProps) {
    super(scope, "ServiceSecurityGroup");
    this.depSecurityGroups = this.getSecurityGroups();

    this.securityGroup = new SecurityGroup(this, "ServiceSecurityGroup", {
      vpc: props.vpc,
      description: `${props.serviceName} service: ingress from the load balancer; egress anywhere`,
      allowAllOutbound: true,
    });
    this.securityGroup.addIngressRule(
      this.depSecurityGroups.alb,
      Port.tcp(props.containerPort),
      "Load balancer",
    );
    this.depSecurityGroups.aurora.addIngressRule(
      this.securityGroup,
      Port.tcp(5432),
      `${props.serviceName} service`,
    );
    this.depSecurityGroups.valkey.addIngressRule(
      this.securityGroup,
      Port.tcp(6379),
      `${props.serviceName} service`,
    );
  }

  private getSecurityGroups(): DependentSecurityGroups {
    return {
      aurora: this.getSecurityGroup(parameters.data.aurora.securityGroupId, "Aurora"),
      alb: this.getSecurityGroup(parameters.compute.alb.securityGroupId, "Alb"),
      valkey: this.getSecurityGroup(parameters.data.valkey.securityGroupId, "Valkey"),
    };
  }

  private getSecurityGroup(paramName: string, logicalName: string): ISecurityGroup {
    const securityGroupId = StringParameter.valueForStringParameter(this, paramName);
    return SecurityGroup.fromSecurityGroupId(this, `${logicalName}SecurityGroup`, securityGroupId);
  }
}

interface DependentSecurityGroups {
  readonly aurora: ISecurityGroup;
  readonly alb: ISecurityGroup;
  readonly valkey: ISecurityGroup;
}
