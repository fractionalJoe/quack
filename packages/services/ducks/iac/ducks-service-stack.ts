import type { Construct } from "constructs";
import { QuackStack } from "@quack/cdk";
import { parameters } from "@quack/shared";
import type { StackProps } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Port, SecurityGroup, Vpc, type ISecurityGroup, type IVpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, type ICluster } from "aws-cdk-lib/aws-ecs";
import {
  ApplicationListener,
  type IApplicationListener,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ServiceSecurityGroup } from "./lib/service-security-group.ts";

interface DucksServiceStackProps extends StackProps {
  vpcName: string;
}

export class DucksServiceStack extends QuackStack {
  private readonly serviceInfo: ServiceInfo;
  private readonly vpc: IVpc;
  private readonly ecsCluster: ICluster;
  private readonly albListener: IApplicationListener;
  private readonly securityGroup: ServiceSecurityGroup;

  constructor(scope: Construct, props: DucksServiceStackProps) {
    super(scope, "QuackDucksServiceStack", props);
    const serviceName = "ducks";
    const containerPort = 3000;

    this.serviceInfo = this.getServiceInfo();
    this.vpc = Vpc.fromLookup(this, "Vpc", { vpcName: props.vpcName });
    this.ecsCluster = this.getEcsCluster();
    this.securityGroup = new ServiceSecurityGroup(this, {
      vpc: this.vpc,
      serviceName,
      serviceInfo: this.serviceInfo,
      containerPort,
    });
    this.albListener = this.getAlbListener();
  }

  private getAlbListener(): IApplicationListener {
    return ApplicationListener.fromApplicationListenerAttributes(this, "AlbListener", {
      listenerArn: this.serviceInfo.compute.alb.listenerArn,
      securityGroup: this.securityGroup.albSecurityGroup,
    });
  }

  private getEcsCluster(): ICluster {
    return Cluster.fromClusterAttributes(this, "EcsCluster", {
      clusterName: this.serviceInfo.compute.clusterName,
      vpc: this.vpc,
    });
  }

  private getStringParam(paramName: string) {
    return StringParameter.valueForStringParameter(this, paramName);
  }

  private getServiceInfo(): ServiceInfo {
    return {
      compute: {
        clusterName: this.getStringParam(parameters.compute.clusterName),
        alb: {
          listenerArn: this.getStringParam(parameters.compute.alb.listenerArn),
          securityGroupId: this.getStringParam(parameters.compute.alb.securityGroupId),
        },
      },
      data: {
        aurora: {
          endpoint: this.getStringParam(parameters.data.aurora.endpoint),
          clusterResourceId: this.getStringParam(parameters.data.aurora.clusterResourceId),
          securityGroupId: this.getStringParam(parameters.data.aurora.securityGroupId),
        },
        valkey: {
          securityGroupId: this.getStringParam(parameters.data.valkey.securityGroupId),
        },
      },
    };
  }
}

export interface ServiceInfo {
  compute: {
    clusterName: string;
    alb: {
      listenerArn: string;
      securityGroupId: string;
    };
  };
  data: {
    aurora: {
      endpoint: string;
      clusterResourceId: string;
      securityGroupId: string;
    };
    valkey: {
      securityGroupId: string;
    };
  };
}
