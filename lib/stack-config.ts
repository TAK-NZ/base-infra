/**
 * Configuration interface for BaseInfra stack template
 * This makes the stack reusable across different projects and environments
 */

import * as cdk from 'aws-cdk-lib';

/**
 * Environment-specific configuration for base infrastructure resources
 */
export interface BaseInfraEnvironmentConfig {
  // VPC and networking configuration
  networking: {
    createNatGateways: boolean;      // Create redundant NAT Gateway for high availability
    createVpcEndpoints: boolean;     // Create VPC interface endpoints for AWS services
  };
  
  // ACM Certificate configuration
  certificate: {
    transparencyLoggingEnabled: boolean;  // Enable certificate transparency logging
  };
  
  // General infrastructure settings
  general: {
    removalPolicy: cdk.RemovalPolicy;     // Resource removal policy
    enableDetailedLogging: boolean;       // Enable detailed CloudWatch logging
    enableContainerInsights: boolean;     // Enable ECS container insights
  };
  
  // KMS configuration
  kms: {
    enableKeyRotation: boolean;           // Enable automatic key rotation
  };
  
  // S3 configuration
  s3: {
    enableVersioning: boolean;            // Enable S3 bucket versioning
    lifecycleRules: boolean;              // Enable S3 lifecycle management
  };
  
  // ECR configuration
  ecr: {
    imageRetentionCount: number;          // Number of images to retain
    scanOnPush: boolean;                  // Enable vulnerability scanning on push
  };
}

/**
 * Complete configuration result with computed values
 * This contains everything the stack needs without additional processing
 */
export interface BaseInfraConfigResult {
  stackConfig: BaseInfraConfig;
  environmentConfig: BaseInfraEnvironmentConfig;
  isHighAvailability: boolean;
  environmentLabel: string;
  createNatGateways: boolean;
  enableVpcEndpoints: boolean;
  certificateTransparency: boolean;
}

export interface BaseInfraConfig {
  // Stack identification
  projectName: string;
  componentName: string;
  
  // Environment configuration
  envType: 'prod' | 'dev-test';
  
  // Required parameters
  r53ZoneName: string;
  
  // Optional overrides
  overrides?: {
    networking?: {
      vpcCidr?: string;
      createNatGateways?: boolean;
      createVpcEndpoints?: boolean;
    };
    certificate?: {
      transparencyLoggingEnabled?: boolean;
    };
    general?: {
      enableDetailedLogging?: boolean;
      enableContainerInsights?: boolean;
    };
    kms?: {
      enableKeyRotation?: boolean;
    };
    s3?: {
      enableVersioning?: boolean;
    };
    ecr?: {
      scanOnPush?: boolean;
    };
  };
}

/**
 * Context-based configuration interface matching cdk.context.json structure
 */
export interface ContextEnvironmentConfig {
  stackName: string;
  r53ZoneName: string;
  vpcCidr?: string;
  networking: {
    createNatGateways: boolean;
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
  ecr: {
    imageRetentionCount: number;
    scanOnPush: boolean;
  };
}

/**
 * Create stack configuration from context-based configuration
 * This is the modern approach that replaces complex parameter parsing with direct context configuration
 */
export function createStackConfigFromContext(
  envType: 'prod' | 'dev-test',
  contextConfig: ContextEnvironmentConfig,
  projectName: string = 'TAK',
  componentName: string = 'BaseInfra'
): BaseInfraConfigResult {
  
  // Validate required parameters
  if (!contextConfig.r53ZoneName || contextConfig.r53ZoneName.trim() === '') {
    throw new Error('r53ZoneName is required and cannot be empty');
  }
  
  if (!['prod', 'dev-test'].includes(envType)) {
    throw new Error('Environment type must be one of: prod, dev-test');
  }

  // Convert context config to BaseInfraEnvironmentConfig
  const environmentConfig: BaseInfraEnvironmentConfig = {
    networking: {
      createNatGateways: contextConfig.networking.createNatGateways,
      createVpcEndpoints: contextConfig.networking.createVpcEndpoints,
    },
    certificate: {
      transparencyLoggingEnabled: contextConfig.certificate.transparencyLoggingEnabled,
    },
    general: {
      removalPolicy: contextConfig.general.removalPolicy === 'DESTROY' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      enableDetailedLogging: contextConfig.general.enableDetailedLogging,
      enableContainerInsights: contextConfig.general.enableContainerInsights,
    },
    kms: {
      enableKeyRotation: contextConfig.kms.enableKeyRotation,
    },
    s3: {
      enableVersioning: contextConfig.s3.enableVersioning,
      lifecycleRules: contextConfig.s3.lifecycleRules,
    },
    ecr: {
      imageRetentionCount: contextConfig.ecr.imageRetentionCount,
      scanOnPush: contextConfig.ecr.scanOnPush,
    },
  };

  // Create stack config
  const stackConfig: BaseInfraConfig = {
    projectName,
    componentName,
    envType,
    r53ZoneName: contextConfig.r53ZoneName,
    overrides: {
      ...(contextConfig.vpcCidr && {
        networking: { vpcCidr: contextConfig.vpcCidr }
      }),
    },
  };

  // Compute derived values
  const isHighAvailability = envType === 'prod';
  const environmentLabel = envType === 'prod' ? 'Prod' : 'Dev-Test';
  
  // Final configuration values 
  const createNatGateways = environmentConfig.networking.createNatGateways;
  const enableVpcEndpoints = environmentConfig.networking.createVpcEndpoints;
  const certificateTransparency = environmentConfig.certificate.transparencyLoggingEnabled;

  return {
    stackConfig,
    environmentConfig,
    isHighAvailability,
    environmentLabel,
    createNatGateways,
    enableVpcEndpoints,
    certificateTransparency,
  };
}
