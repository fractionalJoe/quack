import { SecurityGroup, SubnetType, type IVpc } from "aws-cdk-lib/aws-ec2";
import {
  AuroraPostgresEngineVersion,
  ClusterInstance,
  DatabaseCluster,
  DatabaseClusterEngine,
} from "aws-cdk-lib/aws-rds";
import { Duration, RemovalPolicy } from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface AuroraClusterProps {
  autoPauseSeconds: number;
  databaseName: string;
  vpc: IVpc;
}

export class AuroraCluster extends Construct {
  private readonly cluster: DatabaseCluster;

  public get clusterArn(): string {
    return this.cluster.clusterArn;
  }
  public get secretArn(): string {
    const secret = this.cluster.secret;
    if (!secret) throw new Error("Cluster secret is not available");
    return secret.secretArn;
  }
  public get endpoint(): string {
    return this.cluster.clusterEndpoint.hostname;
  }
  public readonly clusterSecurityGroup: SecurityGroup;

  constructor(scope: Construct, props: AuroraClusterProps) {
    super(scope, "Aurora");

    this.clusterSecurityGroup = new SecurityGroup(this, "ClusterSg", {
      vpc: props.vpc,
      description: "Aurora: Postgres ingress; no egress",
      allowAllOutbound: false,
    });

    this.cluster = new DatabaseCluster(this, "Cluster", {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.of("18.3", "18"),
      }),
      vpc: props.vpc,
      securityGroups: [this.clusterSecurityGroup],
      writer: ClusterInstance.serverlessV2("Writer"),
      serverlessV2MinCapacity: 0,
      serverlessV2AutoPauseDuration: Duration.seconds(props.autoPauseSeconds),
      defaultDatabaseName: props.databaseName,
      manageMasterUserPassword: true,
      enableDataApi: true,
      iamAuthentication: true,
      storageEncrypted: true,
      removalPolicy: RemovalPolicy.DESTROY,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });
  }
}
