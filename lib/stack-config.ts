/**
 * Configuration interface for BaseInfra stack template
 * This makes the stack reusable across different projects and environments
 */

/**
 * Context-based configuration interface matching cdk.context.json structure
 * This is used directly by the stack without complex transformations
 */
export interface ContextEnvironmentConfig {
  stackName: string;
  r53ZoneName: string;
  vpcCidr?: string;
  networking: {
    enableRedundantNatGateways: boolean;
    createVpcEndpoints: boolean;
  };
  certificate: {
    transparencyLoggingEnabled: boolean;
  };
  general: {
    removalPolicy: string;
    enableDetailedLogging: boolean;
    enableContainerInsights: boolean;
  };
  kms: {
    enableKeyRotation: boolean;
  };
  s3: {
    enableVersioning: boolean;
    lifecycleRules: boolean;
  };

}
