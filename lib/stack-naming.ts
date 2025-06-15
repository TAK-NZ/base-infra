/**
 * Utility functions for consistent stack naming across the application
 */

export interface StackNamingConfig {
  project?: string;
  environment?: string;
  component?: string;
  suffix?: string;
}

/**
 * Fixed configuration for the organization
 */
export const FIXED_STACK_CONFIG = {
  PROJECT: 'TAK',
  COMPONENT: 'BaseInfra'
} as const;

/**
 * Generate a consistent stack name based on configuration
 * @param config.environment - The environment/deployment identifier (from stackName in config)
 */
export function generateStackName(config: StackNamingConfig): string {
  const parts = [
    config.project || FIXED_STACK_CONFIG.PROJECT,
    config.environment || 'MyFirstStack',  // This comes from stackName in config
    config.component || FIXED_STACK_CONFIG.COMPONENT
  ];
  
  if (config.suffix) {
    parts.push(config.suffix);
  }
  
  return parts.join('-');
}

/**
 * Common export names for base infrastructure resources
 */
export const EXPORT_NAMES = {
  VPC_ID: 'VPC-ID',
  VPC_CIDR_IPV4: 'VpcIPv4CIDR',
  VPC_CIDR_IPV6: 'VpcIPv6CIDR',
  SUBNET_PUBLIC_A: 'SubnetPublicA',
  SUBNET_PUBLIC_B: 'SubnetPublicB',
  SUBNET_PRIVATE_A: 'SubnetPrivateA',
  SUBNET_PRIVATE_B: 'SubnetPrivateB',
  ECS_CLUSTER: 'Ecs-ARN',
  ECR_REPO: 'Ecr-ARN',
  KMS_KEY: 'Kms-ARN',
  KMS_ALIAS: 'Kms-Alias',
  S3_BUCKET: 'S3ConfBucket-ARN',
  CERTIFICATE_ARN: 'AcmCert-ARN',
  HOSTED_ZONE_ID: 'R53Zone-ID',
} as const;

/**
 * Helper to create CloudFormation Fn::Sub expression for dynamic export names
 * The StackName parameter contains the full stack name (e.g., "TAK-devtest-BaseInfra")
 * This function creates the export name: {StackName}-{resource}
 */
export function createDynamicExportName(resourceType: string): string {
  return `\${StackName}-${resourceType}`;
}
