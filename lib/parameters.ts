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
 * Priority: 1. Environment Variables, 2. CDK Context, 3. Default Values
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
  // Environment variables (first priority)
  const STACK_NAME = process.env.STACK_NAME;
  
  // Context values (second priority)
  const envTypeFromContext = stack.node.tryGetContext('envType');
  const vpcMajorIdFromContext = stack.node.tryGetContext('vpcMajorId');
  const vpcMinorIdFromContext = stack.node.tryGetContext('vpcMinorId');
  const stackNameFromContext = stack.node.tryGetContext('stackName');
  const r53ZoneNameFromContext = stack.node.tryGetContext('r53ZoneName');
  const createNatGatewaysFromContext = stack.node.tryGetContext('createNatGateways');
  const createVpcEndpointsFromContext = stack.node.tryGetContext('createVpcEndpoints');
  const certificateTransparencyFromContext = stack.node.tryGetContext('certificateTransparency');

  // Resolution with environment variables taking precedence
  const envType = process.env.ENV_TYPE || envTypeFromContext || 'dev-test';

  const stackName = STACK_NAME || stackNameFromContext || `${envType}-stack`;

  const vpcMajorId = VPC_MAJOR_ID || (vpcMajorIdFromContext !== undefined ? Number(vpcMajorIdFromContext) : 0);

  const vpcMinorId = VPC_MINOR_ID || (vpcMinorIdFromContext !== undefined ? Number(vpcMinorIdFromContext) : 0);

  const r53ZoneName = R53_ZONE_NAME || r53ZoneNameFromContext;

  // Get environment-specific configuration
  const envConfig = getEnvironmentConfig(envType);

  // Boolean parameters: Environment variables override context, which overrides environment config defaults
  const createNatGateways = CREATE_NAT_GATEWAYS !== undefined 
    ? Boolean(CREATE_NAT_GATEWAYS === 'true')
    : createNatGatewaysFromContext !== undefined
    ? Boolean(createNatGatewaysFromContext)
    : envConfig.networking.createNatGateways;

  const createVpcEndpoints = CREATE_VPC_ENDPOINTS !== undefined
    ? Boolean(CREATE_VPC_ENDPOINTS === 'true')
    : createVpcEndpointsFromContext !== undefined
    ? Boolean(createVpcEndpointsFromContext)
    : envConfig.networking.createVpcEndpoints;

  const certificateTransparency = CERTIFICATE_TRANSPARENCY !== undefined
    ? Boolean(CERTIFICATE_TRANSPARENCY === 'true')
    : certificateTransparencyFromContext !== undefined
    ? Boolean(certificateTransparencyFromContext)
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
