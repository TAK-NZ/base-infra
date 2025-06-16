/**
 * Configuration interface for BaseInfra stack template
 * This makes the stack reusable across different projects and environments
 */

import { getEnvironmentConfig, mergeEnvironmentConfig, BaseInfraEnvironmentConfig } from './environment-config';

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
