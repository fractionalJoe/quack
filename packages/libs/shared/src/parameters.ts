const prefix = "/quack";

export const parameters = {
  compute: {
    clusterName: `${prefix}/compute/cluster-name`,
    alb: {
      listenerArn: `${prefix}/compute/listener-arn`,
      securityGroupId: `${prefix}/compute/alb-security-group-id`,
      dnsName: `${prefix}/compute/alb-dns-name`,
    },
  },
  data: {
    aurora: {
      clusterArn: `${prefix}/data/cluster-arn`,
      secretArn: `${prefix}/data/secret-arn`,
      clusterResourceId: `${prefix}/data/cluster-resource-id`,
      endpoint: `${prefix}/data/endpoint`,
      securityGroupId: `${prefix}/data/security-group-id`,
    },
    valkey: {
      endpoint: `${prefix}/data/valkey-endpoint`,
      securityGroupId: `${prefix}/data/valkey-security-group-id`,
    },
  },
} as const;
