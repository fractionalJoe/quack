import { parameters } from "@quack/shared";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  ContainerImage,
  FargateTaskDefinition,
  LogDrivers,
  type TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { existsSync } from "fs";
import { dirname, join } from "path";

interface ServiceTaskDefinitionProps {
  dbUser: string;
  serviceName: string;
  containerPort: number;
  databaseName: string;
}

export class ServiceTaskDefinition extends Construct {
  public readonly definition: TaskDefinition;

  constructor(scope: Construct, props: ServiceTaskDefinitionProps) {
    super(scope, "TaskDefinition");
    const repoRoot = getRepoRoot();
    const { region, account } = this.getStackInfo();
    const clusterResourceId = this.getClusterResourceId();
    const auroraEndpoint = this.getAuroraEndpoint();

    const logGroup = new LogGroup(this, "LogGroup", {
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.definition = new FargateTaskDefinition(this, "TaskDefinition", {
      cpu: 256,
      memoryLimitMiB: 512,
    });
    this.definition.addToTaskRolePolicy(
      new PolicyStatement({
        actions: ["rds-db:connect"],
        resources: [
          `arn:aws:rds-db:${region}:${account}:dbuser:${clusterResourceId}/${props.dbUser}`,
        ],
      }),
    );
    this.definition.addContainer("Service", {
      image: ContainerImage.fromAsset(repoRoot, {
        file: `packages/services/${props.serviceName}/Dockerfile`,
      }),
      portMappings: [{ containerPort: props.containerPort }],
      logging: LogDrivers.awsLogs({ logGroup, streamPrefix: props.serviceName }),
      environment: {
        PORT: String(props.containerPort),
        DB_HOST: auroraEndpoint,
        DB_USER: props.dbUser,
        DB_NAME: props.databaseName,
      },
    });
  }

  private getStackInfo() {
    const stack = Stack.of(this);
    return { region: stack.region, account: stack.account };
  }

  private getClusterResourceId(): string {
    return StringParameter.valueForStringParameter(this, parameters.data.aurora.clusterResourceId);
  }

  private getAuroraEndpoint(): string {
    return StringParameter.valueForStringParameter(this, parameters.data.aurora.endpoint);
  }
}

export function getRepoRoot(): string {
  const from = import.meta.dirname;
  let dir = from;
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("pnpm-workspace.yaml not found above " + from);
    dir = parent;
  }
  return dir;
}
