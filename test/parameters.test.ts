import { createStackConfigFromContext, ContextEnvironmentConfig, BaseInfraConfigResult } from '../lib/stack-config';

describe('Stack Configuration', () => {
  describe('createStackConfigFromContext', () => {
    const prodContextConfig: ContextEnvironmentConfig = {
      stackName: 'Prod',
      r53ZoneName: 'example.com',
      vpcMajorId: 1,
      vpcMinorId: 0,
      networking: { createNatGateways: true, createVpcEndpoints: true },
      certificate: { transparencyLoggingEnabled: true },
      general: { removalPolicy: 'RETAIN', enableDetailedLogging: true, enableContainerInsights: true },
      kms: { enableKeyRotation: true },
      s3: { enableVersioning: true, lifecycleRules: true },
      ecr: { imageRetentionCount: 20, scanOnPush: true }
    };

    const devTestContextConfig: ContextEnvironmentConfig = {
      stackName: 'Dev',
      r53ZoneName: 'dev.example.com',
      vpcMajorId: 0,
      vpcMinorId: 1,
      networking: { createNatGateways: false, createVpcEndpoints: false },
      certificate: { transparencyLoggingEnabled: false },
      general: { removalPolicy: 'DESTROY', enableDetailedLogging: true, enableContainerInsights: false },
      kms: { enableKeyRotation: false },
      s3: { enableVersioning: false, lifecycleRules: true },
      ecr: { imageRetentionCount: 5, scanOnPush: false }
    };

    it('creates valid config with required parameters for prod', () => {
      const configResult = createStackConfigFromContext('prod', prodContextConfig);
      
      expect(configResult.stackConfig.envType).toBe('prod');
      expect(configResult.stackConfig.r53ZoneName).toBe('example.com');
      expect(configResult.stackConfig.projectName).toBe('TAK');
      expect(configResult.stackConfig.componentName).toBe('BaseInfra');
      expect(configResult.isHighAvailability).toBe(true);
      expect(configResult.environmentLabel).toBe('Prod');
      expect(configResult.createNatGateways).toBe(true);
      expect(configResult.enableVpcEndpoints).toBe(true);
      expect(configResult.certificateTransparency).toBe(true);
    });

    it('creates config with custom project and component names', () => {
      const configResult = createStackConfigFromContext('dev-test', devTestContextConfig, 'MyProject', 'MyComponent');
      
      expect(configResult.stackConfig.projectName).toBe('MyProject');
      expect(configResult.stackConfig.componentName).toBe('MyComponent');
      expect(configResult.isHighAvailability).toBe(false);
      expect(configResult.environmentLabel).toBe('Dev-Test');
      expect(configResult.createNatGateways).toBe(false);
      expect(configResult.enableVpcEndpoints).toBe(false);
      expect(configResult.certificateTransparency).toBe(false);
    });

    it('throws error for empty r53ZoneName', () => {
      const invalidConfig = { ...prodContextConfig, r53ZoneName: '' };
      expect(() => {
        createStackConfigFromContext('prod', invalidConfig);
      }).toThrow('r53ZoneName is required and cannot be empty');
      
      const invalidConfig2 = { ...prodContextConfig, r53ZoneName: '   ' };
      expect(() => {
        createStackConfigFromContext('prod', invalidConfig2);
      }).toThrow('r53ZoneName is required and cannot be empty');
    });

    it('throws error for invalid environment type', () => {
      expect(() => {
        createStackConfigFromContext('invalid' as any, prodContextConfig);
      }).toThrow('Environment type must be one of: prod, dev-test');
    });

    it('processes environment configurations correctly', () => {
      const prodResult = createStackConfigFromContext('prod', prodContextConfig);
      const devResult = createStackConfigFromContext('dev-test', devTestContextConfig);
      
      // Prod environment should have high availability features
      expect(prodResult.environmentConfig.networking.createNatGateways).toBe(true);
      expect(prodResult.environmentConfig.networking.createVpcEndpoints).toBe(true);
      expect(prodResult.environmentConfig.certificate.transparencyLoggingEnabled).toBe(true);
      expect(prodResult.environmentConfig.kms.enableKeyRotation).toBe(true);
      
      // Dev-test environment should be cost-optimized
      expect(devResult.environmentConfig.networking.createNatGateways).toBe(false);
      expect(devResult.environmentConfig.networking.createVpcEndpoints).toBe(false);
      expect(devResult.environmentConfig.certificate.transparencyLoggingEnabled).toBe(false);
      expect(devResult.environmentConfig.kms.enableKeyRotation).toBe(false);
    });
  });
});