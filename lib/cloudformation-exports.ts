/**
 * Simplified CloudFormation export naming
 * Creates predictable exports with stack-name prefix: {StackName}-{LogicalName}
 */

/**
 * Creates a CloudFormation export name with stack prefix
 * @param stackName - The stack name to use as prefix
 * @param logicalName - The logical name for the export
 * @returns Export name in format: {StackName}-{LogicalName}
 */
export function createExportName(stackName: string, logicalName: string): string {
  return `${stackName}-${logicalName}`;
}

/**
 * Creates a dynamic export name using CloudFormation substitution
 * @param logicalName - The logical name for the export
 * @returns Export name template that will be substituted at deployment time
 */
export function createDynamicExportName(logicalName: string): string {
  return `\${AWS::StackName}-${logicalName}`;
}
