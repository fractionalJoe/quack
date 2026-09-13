import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  driver: "aws-data-api",
  schema: "./src/schema",
  out: "./migrations",
  dbCredentials: {
    database: "quack",
    resourceArn: process.env.AWS_RDS_ARN ?? "",
    secretArn: process.env.AWS_RDS_SECRET_ARN ?? "",
  },
});
