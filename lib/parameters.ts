import * as cdk from 'aws-cdk-lib';


// Remove all parameterization logic and CfnParameter usage. Use direct values, env vars, or CDK context instead.
// Refactor all exports to provide direct values or constants as needed for the stack.
// Example: export const VPC_CIDR = process.env.VPC_CIDR || '10.0.0.0/16';

export const ENV_TYPE = process.env.ENV_TYPE as 'prod' | 'dev-test' || 'prod';
export const VPC_MAJOR_ID = Number(process.env.VPC_MAJOR_ID) || 0;
export const VPC_MINOR_ID = Number(process.env.VPC_MINOR_ID) || 0;
export const R53_ZONE_NAME = process.env.R53_ZONE_NAME || '';

export function getParameters() {
  return {
    envType: ENV_TYPE,
    vpcMajorId: VPC_MAJOR_ID,
    vpcMinorId: VPC_MINOR_ID,
  };
}

/**
 * Resolves all stack parameters using cascading resolution
 */
export function resolveStackParameters(stack: cdk.Stack): {
  envType: string;
  vpcMajorId: number;
  vpcMinorId: number;
  stackName: string;
  r53ZoneName: string;
} {
  // Check context first, then use environment variables for fallback
  const envTypeFromContext = stack.node.tryGetContext('envType');
  const vpcMajorIdFromContext = stack.node.tryGetContext('vpcMajorId');
  const vpcMinorIdFromContext = stack.node.tryGetContext('vpcMinorId');
  const stackNameFromContext = stack.node.tryGetContext('stackName');
  const r53ZoneNameFromContext = stack.node.tryGetContext('r53ZoneName');

  const envType = envTypeFromContext || ENV_TYPE;

  const stackName = stackNameFromContext || `${envType}-stack`;

  const vpcMajorId = (vpcMajorIdFromContext !== undefined ? Number(vpcMajorIdFromContext) : VPC_MAJOR_ID);

  const vpcMinorId = (vpcMinorIdFromContext !== undefined ? Number(vpcMinorIdFromContext) : VPC_MINOR_ID);

  const r53ZoneName = r53ZoneNameFromContext || R53_ZONE_NAME;

  // Validate that R53 zone name is provided
  if (!r53ZoneName) {
    throw new Error('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');
  }

  return {
    envType,
    vpcMajorId,
    vpcMinorId,
    stackName,
    r53ZoneName,
  };
}
