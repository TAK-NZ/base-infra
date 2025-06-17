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
 * Legacy environment configuration support (for backward compatibility)
 */
function getEnvironmentConfig(envType: string): BaseInfraEnvironmentConfig {
  if (envType === 'prod' || envType === 'production') {
    return {
      networking: {
        createNatGateways: true,
        createVpcEndpoints: true,
      },
      certificate: {
        transparencyLoggingEnabled: true,
      },
      general: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        enableDetailedLogging: true,
        enableContainerInsights: true,
      },
      kms: {
        enableKeyRotation: true,
      },
      s3: {
        enableVersioning: true,
        lifecycleRules: true,
      },
      ecr: {
        imageRetentionCount: 20,
        scanOnPush: true,
      },
    };
  } else {
    // dev-test default
    return {
      networking: {
        createNatGateways: false,
        createVpcEndpoints: false,
      },
      certificate: {
        transparencyLoggingEnabled: false,
      },
      general: {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        enableDetailedLogging: true,
        enableContainerInsights: false,
      },
      kms: {
        enableKeyRotation: false,
      },
      s3: {
        enableVersioning: false,
        lifecycleRules: true,
      },
      ecr: {
        imageRetentionCount: 5,
        scanOnPush: false,
      },
    };
  }
}

/**
 * Merge environment config with custom overrides
 */
function mergeEnvironmentConfig(
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
      vpcMajorId?: number;
      vpcMinorId?: number;
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

/**
 * Factory function to create complete stack configuration
 * This function consolidates all configuration logic into a single source of truth
 */
export function createStackConfig(
  envType: 'prod' | 'dev-test',
  r53ZoneName: string,
  overrides?: BaseInfraConfig['overrides'],
  projectName: string = 'TAK',
  componentName: string = 'BaseInfra'
): BaseInfraConfigResult {
  // Validate required parameters
  if (!r53ZoneName || r53ZoneName.trim() === '') {
    throw new Error('r53ZoneName is required and cannot be empty');
  }
  
  if (!['prod', 'dev-test'].includes(envType)) {
    throw new Error('Environment type must be one of: prod, dev-test');
  }
  
  // Create basic stack config
  const stackConfig: BaseInfraConfig = {
    projectName,
    componentName,
    envType,
    r53ZoneName,
    overrides,
  };

  // Get environment-specific defaults
  const baseEnvironmentConfig = getEnvironmentConfig(envType);
  
  // Merge with any overrides provided
  const environmentConfig = overrides ? mergeEnvironmentConfig(baseEnvironmentConfig, {
    networking: overrides.networking,
    certificate: overrides.certificate,
    general: overrides.general,
    kms: overrides.kms,
    s3: overrides.s3,
    ecr: overrides.ecr,
  }) : baseEnvironmentConfig;

  // Compute derived values
  const isHighAvailability = envType === 'prod';
  const environmentLabel = envType === 'prod' ? 'Prod' : 'Dev-Test';
  
  // Final configuration values (environment + overrides)
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

/**
 * Context-based configuration interface matching cdk.context.json structure
 */
export interface ContextEnvironmentConfig {
  stackName: string;
  r53ZoneName: string;
  vpcMajorId?: number;
  vpcMinorId?: number;
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
 * This replaces the complex parameter parsing with direct context configuration
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
      ...(contextConfig.vpcMajorId !== undefined && {
        networking: { vpcMajorId: contextConfig.vpcMajorId }
      }),
      ...(contextConfig.vpcMinorId !== undefined && {
        networking: { ...contextConfig.vpcMajorId !== undefined ? { vpcMajorId: contextConfig.vpcMajorId } : {}, vpcMinorId: contextConfig.vpcMinorId }
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

/**
 * Config validator utility
 */
export class ConfigValidator {
  static validate(config: BaseInfraConfig): void {
    if (!config.r53ZoneName || config.r53ZoneName.trim() === '') {
      throw new Error('r53ZoneName is required and cannot be empty');
    }
    
    if (!['prod', 'dev-test'].includes(config.envType)) {
      throw new Error('Environment type must be one of: prod, dev-test');
    }
    
    if (!config.projectName || config.projectName.trim() === '') {
      throw new Error('projectName is required and cannot be empty');
    }
    
    if (!config.componentName || config.componentName.trim() === '') {
      throw new Error('componentName is required and cannot be empty');
    }
  }

  static validateResult(configResult: BaseInfraConfigResult): void {
    this.validate(configResult.stackConfig);
    
    if (!configResult.environmentConfig) {
      throw new Error('environmentConfig is required in configuration result');
    }
    
    if (typeof configResult.isHighAvailability !== 'boolean') {
      throw new Error('isHighAvailability must be a boolean');
    }
  }
}
