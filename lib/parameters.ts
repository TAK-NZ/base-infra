import * as cdk from 'aws-cdk-lib';
import { getEnvironmentConfig } from './environment-config';


// Remove all parameterization logic and CfnParameter usage. Use direct values, env vars, or CDK context instead.
// Refactor all exports to provide direct values or constants as needed for the stack.
// Example: export const VPC_CIDR = process.env.VPC_CIDR || '10.0.0.0/16';

export const ENV_TYPE = process.env.ENV_TYPE as 'prod' | 'dev-test' || 'dev-test';
export const VPC_MAJOR_ID = Number(process.env.VPC_MAJOR_ID) || 0;
export const VPC_MINOR_ID = Number(process.env.VPC_MINOR_ID) || 0;
export const R53_ZONE_NAME = process.env.R53_ZONE_NAME;
export const CREATE_NAT_GATEWAYS = process.env.CREATE_NAT_GATEWAYS;
export const CREATE_VPC_ENDPOINTS = process.env.CREATE_VPC_ENDPOINTS;
export const CERTIFICATE_TRANSPARENCY = process.env.CERTIFICATE_TRANSPARENCY;

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
  createNatGateways: boolean;
  createVpcEndpoints: boolean;
  certificateTransparency: boolean;
} {
  // Check context first, then use environment variables for fallback
  const envTypeFromContext = stack.node.tryGetContext('envType');
  const vpcMajorIdFromContext = stack.node.tryGetContext('vpcMajorId');
  const vpcMinorIdFromContext = stack.node.tryGetContext('vpcMinorId');
  const stackNameFromContext = stack.node.tryGetContext('stackName');
  const r53ZoneNameFromContext = stack.node.tryGetContext('r53ZoneName');
  const createNatGatewaysFromContext = stack.node.tryGetContext('createNatGateways');
  const createVpcEndpointsFromContext = stack.node.tryGetContext('createVpcEndpoints');
  const certificateTransparencyFromContext = stack.node.tryGetContext('certificateTransparency');

  const envType = envTypeFromContext || ENV_TYPE;

  const stackName = stackNameFromContext || `${envType}-stack`;

  const vpcMajorId = (vpcMajorIdFromContext !== undefined ? Number(vpcMajorIdFromContext) : VPC_MAJOR_ID);

  const vpcMinorId = (vpcMinorIdFromContext !== undefined ? Number(vpcMinorIdFromContext) : VPC_MINOR_ID);

  const r53ZoneName = r53ZoneNameFromContext || R53_ZONE_NAME;

  // Get environment-specific configuration
  const envConfig = getEnvironmentConfig(envType);

  // Individual parameters override environment config defaults
  const createNatGateways = createNatGatewaysFromContext !== undefined 
    ? Boolean(createNatGatewaysFromContext)
    : CREATE_NAT_GATEWAYS !== undefined
    ? Boolean(CREATE_NAT_GATEWAYS === 'true')
    : envConfig.networking.createNatGateways;

  const createVpcEndpoints = createVpcEndpointsFromContext !== undefined
    ? Boolean(createVpcEndpointsFromContext)
    : CREATE_VPC_ENDPOINTS !== undefined
    ? Boolean(CREATE_VPC_ENDPOINTS === 'true')
    : envConfig.networking.createVpcEndpoints;

  const certificateTransparency = certificateTransparencyFromContext !== undefined
    ? Boolean(certificateTransparencyFromContext)
    : CERTIFICATE_TRANSPARENCY !== undefined
    ? Boolean(CERTIFICATE_TRANSPARENCY === 'true')
    : envConfig.certificate.transparencyLoggingEnabled;

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
    createNatGateways,
    createVpcEndpoints,
    certificateTransparency,
  };
}
