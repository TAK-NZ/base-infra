/**
 * Configuration interface for BaseInfra stack template
 * This makes the stack reusable across different projects and environments
 */

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
 * Factory function to create stack configuration
 */
export function createStackConfig(
  envType: 'prod' | 'dev-test',
  r53ZoneName: string,
  overrides?: BaseInfraConfig['overrides'],
  projectName: string = 'TAK',
  componentName: string = 'BaseInfra'
): BaseInfraConfig {
  // Validate required parameters
  if (!r53ZoneName || r53ZoneName.trim() === '') {
    throw new Error('r53ZoneName is required and cannot be empty');
  }
  
  if (!['prod', 'dev-test'].includes(envType)) {
    throw new Error('Environment type must be one of: prod, dev-test');
  }
  
  return {
    projectName,
    componentName,
    envType,
    r53ZoneName,
    overrides,
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
}
