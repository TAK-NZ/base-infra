import { createStackConfig, BaseInfraConfig, ConfigValidator } from '../lib/stack-config';

describe('Stack Configuration', () => {
  describe('createStackConfig', () => {
    it('creates valid config with required parameters', () => {
      const config = createStackConfig('prod', 'example.com');
      
      expect(config.envType).toBe('prod');
      expect(config.r53ZoneName).toBe('example.com');
      expect(config.projectName).toBe('TAK');
      expect(config.componentName).toBe('BaseInfra');
    });

    it('creates config with custom project and component names', () => {
      const config = createStackConfig('dev-test', 'test.example.com', undefined, 'MyProject', 'MyComponent');
      
      expect(config.projectName).toBe('MyProject');
      expect(config.componentName).toBe('MyComponent');
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
      
      const config = createStackConfig('dev-test', 'example.com', overrides);
      
      expect(config.overrides).toEqual(overrides);
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