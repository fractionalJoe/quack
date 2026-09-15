import { parameters } from "@quack/shared";
import { Duration } from "aws-cdk-lib";
import { SubnetType, type ISecurityGroup, type IVpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, FargateService, TaskDefinition, type ICluster } from "aws-cdk-lib/aws-ecs";
import {
  ApplicationListener,
  ApplicationProtocol,
  ApplicationTargetGroup,
  ListenerCondition,
  type IApplicationListener,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface QuackFargateServiceProps {
  vpc: IVpc;
  containerPort: number;
  pathPattern: string;
  rulePriority: number;
  securityGroup: ISecurityGroup;
  taskDefinition: TaskDefinition;
  albSecurityGroup: ISecurityGroup;
}

export class QuackFargateService extends Construct {
  private albSecurityGroup: ISecurityGroup;
  private readonly vpc: IVpc;

  constructor(scope: Construct, props: QuackFargateServiceProps) {
    super(scope, "FargateService");
    this.vpc = props.vpc;
    this.albSecurityGroup = props.albSecurityGroup;
    const cluster = this.getCluster();
    const listener = this.getListener();

    const service = new FargateService(this, "Service", {
      cluster: cluster,
      taskDefinition: props.taskDefinition,
      desiredCount: 1,
      securityGroups: [props.securityGroup],
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
    });

    // An imported listener cannot build a target group itself, so the group is explicit.
    const targetGroup = new ApplicationTargetGroup(this, "TargetGroup", {
      vpc: this.vpc,
      port: props.containerPort,
      protocol: ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: { path: "/health" },
      deregistrationDelay: Duration.seconds(10),
    });
    listener.addTargetGroups("Rule", {
      targetGroups: [targetGroup],
      conditions: [ListenerCondition.pathPatterns([props.pathPattern])],
      priority: props.rulePriority,
    });
  }

  private getCluster(): ICluster {
    const clusterName = StringParameter.valueForStringParameter(
      this,
      parameters.compute.clusterName,
    );
    return Cluster.fromClusterAttributes(this, "EcsCluster", {
      clusterName: clusterName,
      vpc: this.vpc,
    });
  }

  private getListener(): IApplicationListener {
    const listenerArn = StringParameter.valueForStringParameter(
      this,
      parameters.compute.alb.listenerArn,
    );
    return ApplicationListener.fromApplicationListenerAttributes(this, "AlbListener", {
      listenerArn: listenerArn,
      securityGroup: this.albSecurityGroup,
    });
  }
}
