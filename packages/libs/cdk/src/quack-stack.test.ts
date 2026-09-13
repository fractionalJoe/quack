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
  const t = Template.fromStack(new TestStack());
  t.hasOutput("Endpoint", { Value: "db.example" });
  t.resourceCountIs("AWS::SSM::Parameter", 0);
});

test("addStackOutput writes a parameter when a name is given", () => {
  const t = Template.fromStack(new TestStack("/quack/data/endpoint"));
  t.hasOutput("Endpoint", { Value: "db.example" });
  t.hasResourceProperties("AWS::SSM::Parameter", {
    Name: "/quack/data/endpoint",
    Type: "String",
    Value: "db.example",
  });
});
