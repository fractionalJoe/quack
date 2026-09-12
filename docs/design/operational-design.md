# Operational design

Configuration, secrets, and ponds are in architecture.md.

## Scaling limits

Where the MVP design stops and what changes.

| Component   | Limit                                                                                                                                                                                                                                                                                                                                                                                       | What changes                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAT gateway | Bills per hour and per gigabyte processed ([VPC pricing](https://aws.amazon.com/vpc/pricing/)). Every image pull, log write, and parameter read from every task crosses it, so the data charge grows with task count. At demo volume the data charge is smaller than the hourly charge of a single interface endpoint ([PrivateLink pricing](https://aws.amazon.com/privatelink/pricing/)). | At production scale, add interface endpoints for ECR, CloudWatch Logs, and SSM and the S3 gateway endpoint, so that traffic stays on the AWS network and off the NAT data charge. The NAT gateway remains for the Google key fetch, which no endpoint covers. |
