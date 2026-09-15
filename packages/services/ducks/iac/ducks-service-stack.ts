import type { Construct } from "constructs";
import { QuackStack } from "@quack/cdk";
import type { StackProps } from "aws-cdk-lib";
import { ServiceSecurityGroup } from "./lib/service-security-group.ts";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { ServiceTaskDefinition } from "./lib/service-task-definition.ts";
import { QuackFargateService } from "./lib/quack-fargate-service.ts";

interface DucksServiceStackProps extends StackProps {
  databaseName: string;
  vpcName: string;
}

export class DucksServiceStack extends QuackStack {
  constructor(scope: Construct, props: DucksServiceStackProps) {
    super(scope, "QuackDucksServiceStack", props);
    const serviceName = "ducks";
    const containerPort = 3000;
    const pathPattern = "/ducks/*";
    const rulePriority = 10;
    const dbUser = "ducks_svc";
    const vpc = Vpc.fromLookup(this, "Vpc", { vpcName: props.vpcName });

    const securityGroup = new ServiceSecurityGroup(this, {
      containerPort,
      serviceName,
      vpc,
    });
    const taskDefinition = new ServiceTaskDefinition(this, {
      containerPort,
      databaseName: props.databaseName,
      dbUser,
      serviceName,
    });
    new QuackFargateService(this, {
      albSecurityGroup: securityGroup.depSecurityGroups.alb,
      containerPort,
      pathPattern,
      rulePriority,
      securityGroup: securityGroup.securityGroup,
      taskDefinition: taskDefinition.definition,
      vpc,
    });
  }
}
