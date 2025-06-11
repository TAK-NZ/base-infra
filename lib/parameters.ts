import { ParameterResolver } from './parameter-resolver';
import { generateStackName, FIXED_STACK_CONFIG } from './stack-naming';
import * as cdk from 'aws-cdk-lib';

export interface BaseParameters {
  envType: 'prod' | 'dev-test';
  vpcMajorId: number;
  vpcMinorId: number;
}

export function getParameters(props?: Partial<BaseParameters>): BaseParameters {
  return {
    envType: props?.envType ?? 'prod',
    vpcMajorId: props?.vpcMajorId ?? 0,
    vpcMinorId: props?.vpcMinorId ?? 0,
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
  resolver: ParameterResolver;
} {
  const resolver = new ParameterResolver();

  // Check context first, then use resolver for fallback
  const envTypeFromContext = stack.node.tryGetContext('envType');
  const vpcMajorIdFromContext = stack.node.tryGetContext('vpcMajorId');
  const vpcMinorIdFromContext = stack.node.tryGetContext('vpcMinorId');
  const stackNameFromContext = stack.node.tryGetContext('stackName');

  const envType = envTypeFromContext || resolver.resolveParameterSync(stack, 'envType', {
    description: 'Environment type',
    default: 'dev-test',
    type: 'String',
    allowedValues: ['prod', 'dev-test'],
    required: true
  }) as string;

  const stackName = stackNameFromContext || resolver.resolveParameterSync(stack, 'stackName', {
    description: 'Stack deployment identifier for naming resources (only the environment part, e.g., "devtest", "prod")',
    default: 'devtest',
    type: 'String',
    required: true
  }) as string;

  const vpcMajorId = (vpcMajorIdFromContext !== undefined ? Number(vpcMajorIdFromContext) : resolver.resolveParameterSync(stack, 'vpcMajorId', {
    description: 'Major VPC ID (0-255) for selecting /16 block from 10.0.0.0/8',
    default: 0,
    type: 'Number',
    minValue: 0,
    maxValue: 255,
    required: true
  })) as number;

  const vpcMinorId = (vpcMinorIdFromContext !== undefined ? Number(vpcMinorIdFromContext) : resolver.resolveParameterSync(stack, 'vpcMinorId', {
    description: 'Minor VPC ID (0-15) for selecting /20 subnet within the /16 block',
    default: 0,
    type: 'Number',
    minValue: 0,
    maxValue: 15,
    required: true
  })) as number;

  return {
    envType,
    vpcMajorId,
    vpcMinorId,
    stackName,
    resolver
  };
}
