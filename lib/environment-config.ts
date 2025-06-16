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
 * Development/Test environment configuration
 * Optimized for cost and development workflow
 */
export const DEV_TEST_CONFIG: BaseInfraEnvironmentConfig = {
  networking: {
    createNatGateways: false,      // Single NAT Gateway only (cost-optimized)
    createVpcEndpoints: false,     // S3 gateway endpoint only (cost-optimized)
  },
  certificate: {
    transparencyLoggingEnabled: false,  // Disable for dev/test to avoid public logs
  },
  general: {
    removalPolicy: cdk.RemovalPolicy.DESTROY,  // Allow resource deletion
    enableDetailedLogging: true,               // Keep logging for debugging
    enableContainerInsights: false,            // Disable to save costs
  },
  kms: {
    enableKeyRotation: false,      // Disable for dev/test
  },
  s3: {
    enableVersioning: false,       // Disable versioning for dev/test
    lifecycleRules: true,          // Enable cleanup rules
  },
  ecr: {
    imageRetentionCount: 5,        // Keep fewer images
    scanOnPush: false,             // Disable scanning to save costs
  },
};

/**
 * Production environment configuration
 * Optimized for high availability, security, and production workloads
 */
export const PROD_CONFIG: BaseInfraEnvironmentConfig = {
  networking: {
    createNatGateways: true,       // Redundant NAT Gateways for high availability
    createVpcEndpoints: true,      // Interface endpoints for security and performance
  },
  certificate: {
    transparencyLoggingEnabled: true,   // Enable for production compliance
  },
  general: {
    removalPolicy: cdk.RemovalPolicy.RETAIN,  // Protect production resources
    enableDetailedLogging: true,              // Enable detailed logging
    enableContainerInsights: true,            // Enable for production monitoring
  },
  kms: {
    enableKeyRotation: true,       // Enable automatic key rotation
  },
  s3: {
    enableVersioning: true,        // Enable versioning for data protection
    lifecycleRules: true,          // Enable intelligent tiering
  },
  ecr: {
    imageRetentionCount: 20,       // Keep more images for rollback capability
    scanOnPush: true,              // Enable vulnerability scanning
  },
};

/**
 * Get environment configuration based on environment type
 */
export function getEnvironmentConfig(envType: string): BaseInfraEnvironmentConfig {
  switch (envType.toLowerCase()) {
    case 'prod':
    case 'production':
      return PROD_CONFIG;
    case 'dev':
    case 'dev-test':
    case 'development':
    default:
      return DEV_TEST_CONFIG;
  }
}

/**
 * Merge environment config with custom overrides
 * Allows fine-grained control over individual settings
 */
export function mergeEnvironmentConfig(
  baseConfig: BaseInfraEnvironmentConfig,
  overrides: {
    networking?: Partial<BaseInfraEnvironmentConfig['networking']>;
    certificate?: Partial<BaseInfraEnvironmentConfig['certificate']>;
    general?: Partial<BaseInfraEnvironmentConfig['general']>;
    kms?: Partial<BaseInfraEnvironmentConfig['kms']>;
    s3?: Partial<BaseInfraEnvironmentConfig['s3']>;
    ecr?: Partial<BaseInfraEnvironmentConfig['ecr']>;
  }
): BaseInfraEnvironmentConfig {
  return {
    networking: { ...baseConfig.networking, ...overrides.networking },
    certificate: { ...baseConfig.certificate, ...overrides.certificate },
    general: { ...baseConfig.general, ...overrides.general },
    kms: { ...baseConfig.kms, ...overrides.kms },
    s3: { ...baseConfig.s3, ...overrides.s3 },
    ecr: { ...baseConfig.ecr, ...overrides.ecr },
  };
}
