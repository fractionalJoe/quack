import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { QuackStack } from "./quack-stack.ts";

class TestStack extends QuackStack {
  constructor(parameterName?: string) {
    super(new App(), "Test");
    this.addStackOutput("Endpoint", "db.example", parameterName);
  }
}

test("addStackOutput writes an output", () => {
  // given
  const stack = new TestStack();

  // when
  const template = Template.fromStack(stack);

  // then
  template.hasOutput("Endpoint", { Value: "db.example" });
  template.resourceCountIs("AWS::SSM::Parameter", 0);
});

test("addStackOutput writes a parameter when a name is given", () => {
  // given
  const stack = new TestStack("/quack/data/endpoint");

  // when
  const template = Template.fromStack(stack);

  // then
  template.hasOutput("Endpoint", { Value: "db.example" });
  template.hasResourceProperties("AWS::SSM::Parameter", {
    Name: "/quack/data/endpoint",
    Type: "String",
    Value: "db.example",
  });
});
