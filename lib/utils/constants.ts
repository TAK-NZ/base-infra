/**
 * Constants and configuration definitions
 * Centralizes magic values and reusable configurations for the TAK-NZ base infrastructure
 */

/**
 * AWS Region constants
 * Predefined regions commonly used in TAK-NZ deployments
 */
export const AWS_REGIONS = {
  /** Asia Pacific (Sydney) - Primary region for TAK-NZ */
  AP_SOUTHEAST_2: 'ap-southeast-2' as const,
  /** US East (N. Virginia) - Global services region */
  US_EAST_1: 'us-east-1' as const,
} as const;

/**
 * Infrastructure default configuration values
 * These can be overridden via CDK context
 */
export const INFRASTRUCTURE_DEFAULTS = {
  /** Default AWS region for all deployments */
  DEFAULT_AWS_REGION: AWS_REGIONS.AP_SOUTHEAST_2,
  /** Default VPC CIDR block - provides ~4000 IP addresses */
  DEFAULT_VPC_CIDR: '10.0.0.0/20' as const,
  /** Maximum number of Availability Zones to use */
  MAX_AZS: 2 as const,
} as const;

// Export individual constants for backward compatibility
export const DEFAULT_AWS_REGION = INFRASTRUCTURE_DEFAULTS.DEFAULT_AWS_REGION;
export const DEFAULT_VPC_CIDR = INFRASTRUCTURE_DEFAULTS.DEFAULT_VPC_CIDR;
