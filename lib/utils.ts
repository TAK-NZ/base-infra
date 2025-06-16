/**
 * Utility functions for CDK infrastructure
 */

/**
 * Validates environment type parameter
 * @param envType - The environment type to validate
 * @throws Error if envType is not valid
 */
export function validateEnvType(envType: string): void {
  if (envType !== 'prod' && envType !== 'dev-test') {
    throw new Error(`Invalid envType: ${envType}. Must be 'prod' or 'dev-test'`);
  }
}

/**
 * Validates required stack name parameter
 * @param stackName - The stack name to validate
 * @throws Error if stackName is missing or empty
 */
export function validateStackName(stackName: string | undefined): void {
  if (!stackName) {
    throw new Error('stackName is required. Use --context stackName=YourStackName');
  }
}

/**
 * Validates required Route53 zone name parameter
 * @param r53ZoneName - The Route53 zone name to validate
 * @throws Error if r53ZoneName is missing or empty
 */
export function validateR53ZoneName(r53ZoneName: string | undefined): void {
  if (!r53ZoneName) {
    throw new Error('r53ZoneName is required. Use --context r53ZoneName=your.domain.com');
  }
}

/**
 * Gets the current Git SHA for tagging resources
 * @returns Git SHA string or 'unknown' if not available
 */
export function getGitSha(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Validates all required CDK context parameters
 * @param params - Object containing all parameters to validate
 */
export function validateCdkContextParams(params: {
  envType: string;
  stackName: string | undefined;
  r53ZoneName: string | undefined;
}): void {
  validateEnvType(params.envType);
  validateStackName(params.stackName);
  validateR53ZoneName(params.r53ZoneName);
}
