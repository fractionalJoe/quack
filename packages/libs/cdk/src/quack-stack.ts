import { CfnOutput, Stack } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class QuackStack extends Stack {
  protected addStackOutput(
    logicalName: string,
    value: string,
    parameterName?: string,
  ): void {
    new CfnOutput(this, logicalName, { value });
    if (parameterName) {
      new StringParameter(this, `${logicalName}Param`, {
        parameterName,
        stringValue: value,
      });
    }
  }
}
