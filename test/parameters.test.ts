import { ContextEnvironmentConfig } from '../lib/stack-config';

describe('Stack Configuration', () => {
  describe('ContextEnvironmentConfig interface', () => {
    const prodContextConfig: ContextEnvironmentConfig = {
      stackName: 'Prod',
      r53ZoneName: 'example.com',
      vpcCidr: '10.1.0.0/20',
      networking: { enableRedundantNatGateways: true, createVpcEndpoints: true },
      certificate: { transparencyLoggingEnabled: true },
      general: { removalPolicy: 'RETAIN' },
      kms: { enableKeyRotation: true },
      s3: { enableVersioning: true }
    };

    const devTestContextConfig: ContextEnvironmentConfig = {
      stackName: 'Dev',
      r53ZoneName: 'dev.example.com',
      vpcCidr: '10.0.0.0/20',
      networking: { enableRedundantNatGateways: false, createVpcEndpoints: false },
      certificate: { transparencyLoggingEnabled: false },
      general: { removalPolicy: 'DESTROY' },
      kms: { enableKeyRotation: false },
      s3: { enableVersioning: false }
    };

    it('validates prod environment configuration structure', () => {
      expect(prodContextConfig.stackName).toBe('Prod');
      expect(prodContextConfig.r53ZoneName).toBe('example.com');
      expect(prodContextConfig.vpcCidr).toBe('10.1.0.0/20');
      expect(prodContextConfig.networking.enableRedundantNatGateways).toBe(true);
      expect(prodContextConfig.networking.createVpcEndpoints).toBe(true);
      expect(prodContextConfig.certificate.transparencyLoggingEnabled).toBe(true);
      expect(prodContextConfig.general.removalPolicy).toBe('RETAIN');
      expect(prodContextConfig.kms.enableKeyRotation).toBe(true);
      expect(prodContextConfig.s3.enableVersioning).toBe(true);
    });

    it('validates dev-test environment configuration structure', () => {
      expect(devTestContextConfig.stackName).toBe('Dev');
      expect(devTestContextConfig.r53ZoneName).toBe('dev.example.com');
      expect(devTestContextConfig.vpcCidr).toBe('10.0.0.0/20');
      expect(devTestContextConfig.networking.enableRedundantNatGateways).toBe(false);
      expect(devTestContextConfig.networking.createVpcEndpoints).toBe(false);
      expect(devTestContextConfig.certificate.transparencyLoggingEnabled).toBe(false);
      expect(devTestContextConfig.general.removalPolicy).toBe('DESTROY');
      expect(devTestContextConfig.kms.enableKeyRotation).toBe(false);
      expect(devTestContextConfig.s3.enableVersioning).toBe(false);
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