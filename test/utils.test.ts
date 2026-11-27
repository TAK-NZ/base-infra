import { generateStandardTags } from '../lib/utils/tag-helpers';
import { applyContextOverrides } from '../lib/utils/context-overrides';
import { ContextEnvironmentConfig } from '../lib/stack-config';

// Helper function to create a complete test config
const createTestConfig = (overrides: Partial<ContextEnvironmentConfig> = {}): ContextEnvironmentConfig => ({
  stackName: 'Test',
  r53ZoneName: 'test.example.com',
  vpcCidr: '10.0.0.0/16',
  networking: { enableRedundantNatGateways: true, createVpcEndpoints: false },
  certificate: { transparencyLoggingEnabled: true },
  general: { 
    removalPolicy: 'DESTROY'
  },
  kms: { enableKeyRotation: true },
  s3: { enableVersioning: true, elbLogsRetentionDays: 30 },
  ecr: { imageRetentionCount: 5, scanOnPush: true },
  cloudTrail: { enabled: true, logRetentionDays: 90 },
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



  describe('applyContextOverrides', () => {
    it('applies context overrides correctly', () => {
      const mockApp = {
        node: {
          tryGetContext: jest.fn((key) => {
            const context: { [key: string]: any } = {
              'vpcCidr': '192.168.0.0/16',
              'enableRedundantNatGateways': false,
              'transparencyLoggingEnabled': false
            };
            return context[key];
          })
        }
      } as any;

      const baseConfig = createTestConfig();
      const result = applyContextOverrides(mockApp, baseConfig);

      expect(result.vpcCidr).toBe('192.168.0.0/16');
      expect(result.networking.enableRedundantNatGateways).toBe(false);
      expect(result.certificate.transparencyLoggingEnabled).toBe(false);
    });

    it('overrides cloudTrail.enabled with createCloudTrail, including CLI string values', () => {
      const makeApp = (value: unknown) => ({
        node: { tryGetContext: jest.fn((key) => (key === 'createCloudTrail' ? value : undefined)) }
      } as any);
      const baseConfig = createTestConfig();

      expect(applyContextOverrides(makeApp('false'), baseConfig).cloudTrail.enabled).toBe(false);
      expect(applyContextOverrides(makeApp(false), baseConfig).cloudTrail.enabled).toBe(false);
      expect(applyContextOverrides(makeApp('true'), createTestConfig({ cloudTrail: { enabled: false, logRetentionDays: 90 } })).cloudTrail.enabled).toBe(true);
      expect(applyContextOverrides(makeApp('false'), baseConfig).cloudTrail.logRetentionDays).toBe(90);
    });

    it('overrides networking.excludePublicSubnetsFromBpa, including CLI string values', () => {
      const makeApp = (value: unknown) => ({
        node: { tryGetContext: jest.fn((key) => (key === 'excludePublicSubnetsFromBpa' ? value : undefined)) }
      } as any);
      const baseConfig = createTestConfig({ networking: { enableRedundantNatGateways: true, createVpcEndpoints: false, excludePublicSubnetsFromBpa: true } });

      expect(applyContextOverrides(makeApp('false'), baseConfig).networking.excludePublicSubnetsFromBpa).toBe(false);
      expect(applyContextOverrides(makeApp(undefined), baseConfig).networking.excludePublicSubnetsFromBpa).toBe(true);
      expect(applyContextOverrides(makeApp('true'), createTestConfig({ networking: { enableRedundantNatGateways: true, createVpcEndpoints: false, excludePublicSubnetsFromBpa: false } })).networking.excludePublicSubnetsFromBpa).toBe(true);
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