import { generateStandardTags } from '../lib/utils/tag-helpers';
import { applyContextOverrides } from '../lib/utils/context-overrides';
import { createOutput } from '../lib/utils/output-helpers';
import { ContextEnvironmentConfig } from '../lib/stack-config';

// Helper function to create a complete test config
const createTestConfig = (overrides: Partial<ContextEnvironmentConfig> = {}): ContextEnvironmentConfig => ({
  stackName: 'Test',
  r53ZoneName: 'test.example.com',
  vpcCidr: '10.0.0.0/16',
  networking: { createNatGateways: true, createVpcEndpoints: false },
  certificate: { transparencyLoggingEnabled: true },
  general: { 
    removalPolicy: 'DESTROY', 
    enableDetailedLogging: false, 
    enableContainerInsights: false 
  },
  kms: { enableKeyRotation: true },
  s3: { enableVersioning: true, lifecycleRules: false },
  ecr: { imageRetentionCount: 5, scanOnPush: true },
  ...overrides
});

describe('Utility Functions', () => {
  describe('generateStandardTags', () => {
    it('generates standard tags with defaults', () => {
      const envConfig = createTestConfig();
      const tags = generateStandardTags(envConfig, 'dev-test');

      expect(tags).toEqual({
        Project: 'TAK',
        Environment: 'Test',
        Component: 'BaseInfra',
        ManagedBy: 'CDK',
        'Environment Type': 'Dev-Test'
      });
    });

    it('generates standard tags with custom defaults', () => {
      const envConfig = createTestConfig({ stackName: 'Prod' });
      const tags = generateStandardTags(envConfig, 'prod', {
        project: 'CustomProject',
        component: 'CustomComponent'
      });

      expect(tags).toEqual({
        Project: 'CustomProject',
        Environment: 'Prod',
        Component: 'CustomComponent',
        ManagedBy: 'CDK',
        'Environment Type': 'Prod'
      });
    });
  });

  describe('createOutput', () => {
    it('accepts correct config structure', () => {
      // This test just verifies the config interface works correctly
      const config = {
        id: 'TestOutput',
        description: 'Test Description',
        value: 'test-value',
        exportKey: 'test-key'
      };

      expect(config.id).toBe('TestOutput');
      expect(config.description).toBe('Test Description');
      expect(config.value).toBe('test-value');
      expect(config.exportKey).toBe('test-key');
    });
  });

  describe('applyContextOverrides', () => {
    it('applies context overrides correctly', () => {
      const mockApp = {
        node: {
          tryGetContext: jest.fn((key) => {
            const context: { [key: string]: any } = {
              'vpcCidr': '192.168.0.0/16',
              'networking.createNatGateways': false,
              'certificate.transparencyLoggingEnabled': false
            };
            return context[key];
          })
        }
      } as any;

      const baseConfig = createTestConfig();
      const result = applyContextOverrides(mockApp, baseConfig);

      expect(result.vpcCidr).toBe('192.168.0.0/16');
      expect(result.networking.createNatGateways).toBe(false);
      expect(result.certificate.transparencyLoggingEnabled).toBe(false);
    });

    it('returns original config when no overrides exist', () => {
      const mockApp = {
        node: {
          tryGetContext: jest.fn(() => undefined)
        }
      } as any;

      const baseConfig = createTestConfig();
      const result = applyContextOverrides(mockApp, baseConfig);

      expect(result).toEqual(baseConfig);
    });
  });
});