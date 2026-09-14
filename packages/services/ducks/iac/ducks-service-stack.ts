import type { Construct } from "constructs";
import { QuackStack } from "@quack/cdk";
import type { StackProps } from "aws-cdk-lib";

interface DucksServiceStackProps extends StackProps {}

export class DucksServiceStack extends QuackStack {
  constructor(scope: Construct, props: DucksServiceStackProps) {
    super(scope, "QuackDucksServiceStack", props);
  }
}
