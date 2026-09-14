import { type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { QuackStack } from "@quack/cdk";
import { parameters } from "@quack/shared";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { ClusterLoadBalancer } from "./lib/cluster-load-balancer.ts";

export interface ComputeStackProps extends StackProps {
  apiHostname: string;
  vpcName: string;
}

export class ComputeStack extends QuackStack {
  constructor(scope: Construct, props: ComputeStackProps) {
    super(scope, "QuackComputeStack", props);

    const vpc = Vpc.fromLookup(this, "Vpc", {
      vpcName: props.vpcName,
    });

    const cluster = new Cluster(this, "Cluster", { vpc });

    const certificate = new Certificate(this, "ApiCertificate", {
      domainName: props.apiHostname,
      validation: CertificateValidation.fromDns(),
    });

    const loadBalancer = new ClusterLoadBalancer(this, {
      vpc,
      certificate,
    });

    this.addStackOutput("ClusterName", cluster.clusterName, parameters.compute.clusterName);
    this.addStackOutput("ListenerArn", loadBalancer.listenerArn, parameters.compute.listenerArn);
    this.addStackOutput(
      "AlbSecurityGroupId",
      loadBalancer.securityGroup.securityGroupId,
      parameters.compute.albSecurityGroupId,
    );
    this.addStackOutput(
      "AlbDnsName",
      loadBalancer.loadBalancerDnsName,
      parameters.compute.albDnsName,
    );
  }
}
