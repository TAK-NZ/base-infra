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
    config.environment || 'DevTest',  // This comes from stackName in config
    config.component || FIXED_STACK_CONFIG.COMPONENT
  ];
  
  if (config.suffix) {
    parts.push(config.suffix);
  }
  
  return parts.join('-');
}

/**
 * Generate a stack name with fixed project/component and configurable deployment identifier
 * @param deployment - The deployment identifier (e.g., "devtest", "prod", "staging")
 */
export function generateBaseInfraStackName(deployment: string): string {
  return `${FIXED_STACK_CONFIG.PROJECT}-${deployment}-${FIXED_STACK_CONFIG.COMPONENT}`;
}

/**
 * Generate export names for cross-stack references
 */
export function generateExportName(stackName: string, resourceType: string): string {
  return `${stackName}-${resourceType}`;
}

/**
 * Generate export name with environment parameter (for CloudFormation functions)
 * @param environment - The environment type (e.g., "dev-test", "prod") from EnvType parameter
 */
export function generateDynamicExportName(environment: string, resourceType: string): string {
  const stackName = generateBaseInfraStackName(environment);
  return generateExportName(stackName, resourceType);
}

/**
 * Get the base infrastructure stack name for imports
 * @param deployment - The deployment identifier (e.g., "devtest", "prod") 
 * @deprecated Use generateBaseInfraStackName instead
 */
export function getBaseInfraStackName(deployment: string = 'DevTest'): string {
  return generateBaseInfraStackName(deployment);
}

/**
 * Common export names for base infrastructure resources
 */
export const EXPORT_NAMES = {
  VPC_ID: 'vpc-id',
  VPC_CIDR_IPV4: 'vpc-cidr-ipv4',
  VPC_CIDR_IPV6: 'vpc-cidr-ipv6',
  SUBNET_PUBLIC_A: 'subnet-public-a',
  SUBNET_PUBLIC_B: 'subnet-public-b',
  SUBNET_PRIVATE_A: 'subnet-private-a',
  SUBNET_PRIVATE_B: 'subnet-private-b',
  ECS_CLUSTER: 'ecs',
  ECR_REPO: 'ecr',
  KMS_KEY: 'kms',
  S3_BUCKET: 's3'
} as const;

/**
 * Helper to create CloudFormation Fn::Sub expression for dynamic export names
 * The StackName parameter contains only the environment identifier (e.g., "devtest")
 * This function creates the full export name: TAK-{environment}-BaseInfra-{resource}
 */
export function createDynamicExportName(resourceType: string): string {
  return `${FIXED_STACK_CONFIG.PROJECT}-\${StackName}-${FIXED_STACK_CONFIG.COMPONENT}-${resourceType}`;
}
