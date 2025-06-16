import { createStackConfig, BaseInfraConfig, BaseInfraConfigResult, ConfigValidator } from '../lib/stack-config';

describe('Stack Configuration', () => {
  describe('createStackConfig', () => {
    it('creates valid config with required parameters', () => {
      const configResult = createStackConfig('prod', 'example.com');
      
      expect(configResult.stackConfig.envType).toBe('prod');
      expect(configResult.stackConfig.r53ZoneName).toBe('example.com');
      expect(configResult.stackConfig.projectName).toBe('TAK');
      expect(configResult.stackConfig.componentName).toBe('BaseInfra');
      expect(configResult.isHighAvailability).toBe(true);
      expect(configResult.environmentLabel).toBe('Prod');
    });

    it('creates config with custom project and component names', () => {
      const configResult = createStackConfig('dev-test', 'test.example.com', undefined, 'MyProject', 'MyComponent');
      
      expect(configResult.stackConfig.projectName).toBe('MyProject');
      expect(configResult.stackConfig.componentName).toBe('MyComponent');
      expect(configResult.isHighAvailability).toBe(false);
      expect(configResult.environmentLabel).toBe('Dev-Test');
    });

    it('throws error for empty r53ZoneName', () => {
      expect(() => {
        createStackConfig('prod', '');
      }).toThrow('r53ZoneName is required and cannot be empty');
      
      expect(() => {
        createStackConfig('prod', '   ');
      }).toThrow('r53ZoneName is required and cannot be empty');
    });

    it('throws error for invalid environment type', () => {
      expect(() => {
        createStackConfig('invalid' as any, 'example.com');
      }).toThrow('Environment type must be one of: prod, dev-test');
    });

    it('accepts overrides configuration', () => {
      const overrides = {
        networking: { createNatGateways: true },
        certificate: { transparencyLoggingEnabled: false }
      };
      
      const configResult = createStackConfig('dev-test', 'example.com', overrides);
      
      expect(configResult.stackConfig.overrides).toEqual(overrides);
      expect(configResult.createNatGateways).toBe(true); // Override applied
      expect(configResult.certificateTransparency).toBe(false); // Override applied
    });
  });

  describe('ConfigValidator', () => {
    it('validates valid configuration', () => {
      const config: BaseInfraConfig = {
        projectName: 'TAK',
        componentName: 'BaseInfra',
        envType: 'prod',
        r53ZoneName: 'example.com'
      };
      
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it('throws error for missing r53ZoneName', () => {
      const config: BaseInfraConfig = {
        projectName: 'TAK',
        componentName: 'BaseInfra',
        envType: 'prod',
        r53ZoneName: ''
      };
      
      expect(() => ConfigValidator.validate(config)).toThrow('r53ZoneName is required and cannot be empty');
    });

    it('throws error for invalid envType', () => {
      const config: BaseInfraConfig = {
        projectName: 'TAK',
        componentName: 'BaseInfra',
        envType: 'invalid' as any,
        r53ZoneName: 'example.com'
      };
      
      expect(() => ConfigValidator.validate(config)).toThrow('Environment type must be one of: prod, dev-test');
    });
  });
});