const prefix = "/quack";

export const parameters = {
  compute: {
    clusterName: `${prefix}/compute/cluster-name`,
    listenerArn: `${prefix}/compute/listener-arn`,
    albSecurityGroupId: `${prefix}/compute/alb-security-group-id`,
    albDnsName: `${prefix}/compute/alb-dns-name`,
  },
  data: {
    clusterArn: `${prefix}/data/cluster-arn`,
    secretArn: `${prefix}/data/secret-arn`,
    clusterResourceId: `${prefix}/data/cluster-resource-id`,
    endpoint: `${prefix}/data/endpoint`,
    securityGroupId: `${prefix}/data/security-group-id`,
    valkeyEndpoint: `${prefix}/data/valkey-endpoint`,
    valkeySecurityGroupId: `${prefix}/data/valkey-security-group-id`,
  },
} as const;
