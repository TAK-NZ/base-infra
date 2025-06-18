/**
 * Output creation helpers
 * Standardizes CloudFormation output creation and reduces boilerplate
 */

import * as cdk from 'aws-cdk-lib';
import { Fn } from 'aws-cdk-lib';
import { createDynamicExportName } from '../cloudformation-exports';

/**
 * Configuration for creating a CloudFormation output
 */
export interface OutputConfig {
  id: string;
  description: string;
  value: any;
  exportKey: string;
}

/**
 * Creates a CloudFormation output with standardized export naming
 * 
 * @param stack - CDK Stack to add the output to
 * @param stackName - Stack name for export naming
 * @param config - Output configuration
 */
export function createOutput(
  stack: cdk.Stack,
  stackName: string,
  config: OutputConfig
): cdk.CfnOutput {
  return new cdk.CfnOutput(stack, config.id, {
    description: config.description,
    value: config.value,
    exportName: Fn.sub(createDynamicExportName(config.exportKey), {
      StackName: stackName,
    }),
  });
}

/**
 * Creates multiple outputs from a configuration array
 * 
 * @param stack - CDK Stack to add outputs to
 * @param stackName - Stack name for export naming
 * @param configs - Array of output configurations
 */
export function createOutputs(
  stack: cdk.Stack,
  stackName: string,
  configs: OutputConfig[]
): cdk.CfnOutput[] {
  return configs.map(config => createOutput(stack, stackName, config));
}

/**
 * Helper to create conditional outputs (only if value exists)
 * 
 * @param stack - CDK Stack to add outputs to
 * @param stackName - Stack name for export naming
 * @param configs - Array of output configurations (with potentially undefined values)
 */
export function createConditionalOutputs(
  stack: cdk.Stack,
  stackName: string,
  configs: Array<OutputConfig & { condition?: boolean }>
): cdk.CfnOutput[] {
  return configs
    .filter(config => config.condition !== false && config.value !== undefined)
    .map(config => createOutput(stack, stackName, config));
}
