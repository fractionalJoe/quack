import {
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  type ISecurityGroup,
  type IVpc,
} from "aws-cdk-lib/aws-ec2";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ListenerAction,
  SslPolicy,
  type IApplicationListener,
  type IApplicationLoadBalancer,
  type IListenerCertificate,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

interface ClusterLoadBalancerProps {
  vpc: IVpc;
  certificate: IListenerCertificate;
}

export class ClusterLoadBalancer extends Construct {
  private readonly listener: IApplicationListener;
  private readonly loadBalancer: IApplicationLoadBalancer;
  public get listenerArn(): string {
    return this.listener.listenerArn;
  }
  public get loadBalancerDnsName(): string {
    return this.loadBalancer.loadBalancerDnsName;
  }
  public readonly securityGroup: ISecurityGroup;

  constructor(scope: Construct, props: ClusterLoadBalancerProps) {
    super(scope, "ClusterLoadBalancer");

    this.securityGroup = new SecurityGroup(this, "SecurityGroup", {
      vpc: props.vpc,
      description: "Load balancer: HTTPS ingress from anywhere; egress inside the VPC",
      allowAllOutbound: false,
    });
    this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS");
    this.securityGroup.addEgressRule(Peer.ipv4(props.vpc.vpcCidrBlock), Port.allTcp(), "Services");

    this.loadBalancer = new ApplicationLoadBalancer(this, "Alb", {
      vpc: props.vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      securityGroup: this.securityGroup,
    });

    this.listener = this.loadBalancer.addListener("HttpsListener", {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      certificates: [props.certificate],
      sslPolicy: SslPolicy.RECOMMENDED_TLS,
      defaultAction: ListenerAction.fixedResponse(404, {
        contentType: "text/plain",
        messageBody: "no route",
      }),
    });
  }
}
