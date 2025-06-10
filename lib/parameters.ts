import { ParameterResolver } from './parameter-resolver';
import * as cdk from 'aws-cdk-lib';

export interface BaseParameters {
  envType: 'prod' | 'dev-test';
  vpcLocationId: number;
}

export function getParameters(props?: Partial<BaseParameters>): BaseParameters {
  return {
    envType: props?.envType ?? 'prod',
    vpcLocationId: props?.vpcLocationId ?? 0,
  };
}

/**
 * Resolves all stack parameters using cascading resolution
 */
export function resolveStackParameters(stack: cdk.Stack): {
  envType: string;
  vpcLocationId: number;
  resolver: ParameterResolver;
} {
  const resolver = new ParameterResolver();

  // Check context first, then use resolver for fallback
  const envTypeFromContext = stack.node.tryGetContext('envType');
  const vpcLocationIdFromContext = stack.node.tryGetContext('vpcLocationId');

  const envType = envTypeFromContext || resolver.resolveParameterSync(stack, 'envType', {
    description: 'Environment type',
    default: 'dev-test',
    type: 'String',
    allowedValues: ['prod', 'dev-test'],
    required: true
  }) as string;

  const vpcLocationId = (vpcLocationIdFromContext !== undefined ? Number(vpcLocationIdFromContext) : resolver.resolveParameterSync(stack, 'vpcLocationId', {
    description: 'Unique VPC ID per AWS regions (0-255)',
    default: 0,
    type: 'Number',
    minValue: 0,
    maxValue: 255,
    required: true
  })) as number;

  // Log what we're using from context if applicable
  if (envTypeFromContext) {
    console.log(`✓ Using envType from context: ${envType}`);
  }
  if (vpcLocationIdFromContext !== undefined) {
    console.log(`✓ Using vpcLocationId from context: ${vpcLocationId}`);
  }

  return {
    envType,
    vpcLocationId,
    resolver
  };
}
