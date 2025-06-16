/**
 * CloudFormation export naming utilities
 * Provides consistent naming for stack exports and resource references
 */

/**
 * Common export names for base infrastructure resources
 * These are used to create CloudFormation exports that other stacks can import
 */
export const BASE_EXPORT_NAMES = {
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
  HOSTED_ZONE_NAME: 'R53Zone-Name',
} as const;

/**
 * Helper to create CloudFormation Fn::Sub expression for dynamic export names
 * The StackName parameter contains the full stack name (e.g., "TAK-Dev-BaseInfra")
 * This function creates the export name: {StackName}-{resource}
 * 
 * @param resourceType - The resource type from EXPORT_NAMES
 * @returns A CloudFormation Fn::Sub template string
 * 
 * @example
 * createDynamicExportName('VPC-ID') returns "${StackName}-VPC-ID"
 * Which resolves to "TAK-Dev-BaseInfra-VPC-ID" when deployed
 */
export function createDynamicExportName(resourceType: string): string {
  return `\${StackName}-${resourceType}`;
}
