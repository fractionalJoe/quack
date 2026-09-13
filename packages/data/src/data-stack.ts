import { Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";

export interface DataStackProps extends StackProps {
}

export class DataStack extends Stack {
  constructor(scope: Construct, props: DataStackProps) {
    super(scope, "QuackDataStack", props);
  }
}
