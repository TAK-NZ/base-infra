import { ContextEnvironmentConfig } from '../lib/stack-config';

describe('Stack Configuration', () => {
  describe('ContextEnvironmentConfig interface', () => {
    const prodContextConfig: ContextEnvironmentConfig = {
      stackName: 'Prod',
      r53ZoneName: 'example.com',
      vpcCidr: '10.1.0.0/20',
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
      vpcCidr: '10.0.0.0/20',
      networking: { createNatGateways: false, createVpcEndpoints: false },
      certificate: { transparencyLoggingEnabled: false },
      general: { removalPolicy: 'DESTROY', enableDetailedLogging: true, enableContainerInsights: false },
      kms: { enableKeyRotation: false },
      s3: { enableVersioning: false, lifecycleRules: true },
      ecr: { imageRetentionCount: 5, scanOnPush: false }
    };

    it('validates prod environment configuration structure', () => {
      expect(prodContextConfig.stackName).toBe('Prod');
      expect(prodContextConfig.r53ZoneName).toBe('example.com');
      expect(prodContextConfig.vpcCidr).toBe('10.1.0.0/20');
      expect(prodContextConfig.networking.createNatGateways).toBe(true);
      expect(prodContextConfig.networking.createVpcEndpoints).toBe(true);
      expect(prodContextConfig.certificate.transparencyLoggingEnabled).toBe(true);
      expect(prodContextConfig.general.removalPolicy).toBe('RETAIN');
      expect(prodContextConfig.general.enableDetailedLogging).toBe(true);
      expect(prodContextConfig.general.enableContainerInsights).toBe(true);
      expect(prodContextConfig.kms.enableKeyRotation).toBe(true);
      expect(prodContextConfig.s3.enableVersioning).toBe(true);
      expect(prodContextConfig.s3.lifecycleRules).toBe(true);
      expect(prodContextConfig.ecr.imageRetentionCount).toBe(20);
      expect(prodContextConfig.ecr.scanOnPush).toBe(true);
    });

    it('validates dev-test environment configuration structure', () => {
      expect(devTestContextConfig.stackName).toBe('Dev');
      expect(devTestContextConfig.r53ZoneName).toBe('dev.example.com');
      expect(devTestContextConfig.vpcCidr).toBe('10.0.0.0/20');
      expect(devTestContextConfig.networking.createNatGateways).toBe(false);
      expect(devTestContextConfig.networking.createVpcEndpoints).toBe(false);
      expect(devTestContextConfig.certificate.transparencyLoggingEnabled).toBe(false);
      expect(devTestContextConfig.general.removalPolicy).toBe('DESTROY');
      expect(devTestContextConfig.general.enableDetailedLogging).toBe(true);
      expect(devTestContextConfig.general.enableContainerInsights).toBe(false);
      expect(devTestContextConfig.kms.enableKeyRotation).toBe(false);
      expect(devTestContextConfig.s3.enableVersioning).toBe(false);
      expect(devTestContextConfig.s3.lifecycleRules).toBe(true);
      expect(devTestContextConfig.ecr.imageRetentionCount).toBe(5);
      expect(devTestContextConfig.ecr.scanOnPush).toBe(false);
    });

    it('validates optional vpcCidr property', () => {
      const configWithoutVpcCidr: ContextEnvironmentConfig = {
        ...devTestContextConfig,
        vpcCidr: undefined
      };
      
      expect(configWithoutVpcCidr.vpcCidr).toBeUndefined();
      expect(typeof configWithoutVpcCidr.r53ZoneName).toBe('string');
      expect(typeof configWithoutVpcCidr.networking).toBe('object');
    });
  });
});
