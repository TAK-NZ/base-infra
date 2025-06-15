import { getEnvironmentConfig, mergeEnvironmentConfig, DEV_TEST_CONFIG, PROD_CONFIG, STAGING_CONFIG } from '../lib/environment-config';

describe('Environment Configuration', () => {
  describe('getEnvironmentConfig', () => {
    it('returns dev-test config for dev environment types', () => {
      expect(getEnvironmentConfig('dev')).toEqual(DEV_TEST_CONFIG);
      expect(getEnvironmentConfig('dev-test')).toEqual(DEV_TEST_CONFIG);
      expect(getEnvironmentConfig('development')).toEqual(DEV_TEST_CONFIG);
      expect(getEnvironmentConfig('unknown')).toEqual(DEV_TEST_CONFIG); // Default fallback
    });

    it('returns prod config for production environment types', () => {
      expect(getEnvironmentConfig('prod')).toEqual(PROD_CONFIG);
      expect(getEnvironmentConfig('production')).toEqual(PROD_CONFIG);
    });

    it('returns staging config for staging environment types', () => {
      expect(getEnvironmentConfig('staging')).toEqual(STAGING_CONFIG);
      expect(getEnvironmentConfig('stage')).toEqual(STAGING_CONFIG);
    });

    it('is case insensitive', () => {
      expect(getEnvironmentConfig('PROD')).toEqual(PROD_CONFIG);
      expect(getEnvironmentConfig('Dev-Test')).toEqual(DEV_TEST_CONFIG);
      expect(getEnvironmentConfig('STAGING')).toEqual(STAGING_CONFIG);
    });
  });

  describe('mergeEnvironmentConfig', () => {
    it('merges networking overrides correctly', () => {
      const baseConfig = DEV_TEST_CONFIG;
      const overrides = {
        networking: {
          createNatGateways: true, // Override dev-test default
        }
      };

      const merged = mergeEnvironmentConfig(baseConfig, overrides);
      
      expect(merged.networking.createNatGateways).toBe(true);
      expect(merged.networking.createVpcEndpoints).toBe(false); // Unchanged
      expect(merged.certificate).toEqual(baseConfig.certificate); // Unchanged
    });

    it('merges certificate overrides correctly', () => {
      const baseConfig = DEV_TEST_CONFIG;
      const overrides = {
        certificate: {
          transparencyLoggingEnabled: true, // Override dev-test default
        }
      };

      const merged = mergeEnvironmentConfig(baseConfig, overrides);
      
      expect(merged.certificate.transparencyLoggingEnabled).toBe(true);
      expect(merged.networking).toEqual(baseConfig.networking); // Unchanged
    });

    it('merges multiple section overrides correctly', () => {
      const baseConfig = DEV_TEST_CONFIG;
      const overrides = {
        networking: {
          createNatGateways: true,
          createVpcEndpoints: true,
        },
        certificate: {
          transparencyLoggingEnabled: true,
        },
        ecr: {
          imageRetentionCount: 15,
        }
      };

      const merged = mergeEnvironmentConfig(baseConfig, overrides);
      
      expect(merged.networking.createNatGateways).toBe(true);
      expect(merged.networking.createVpcEndpoints).toBe(true);
      expect(merged.certificate.transparencyLoggingEnabled).toBe(true);
      expect(merged.ecr.imageRetentionCount).toBe(15);
      expect(merged.ecr.scanOnPush).toBe(false); // Unchanged from base
    });
  });

  describe('environment-specific defaults', () => {
    it('dev-test has cost-optimized defaults', () => {
      const config = DEV_TEST_CONFIG;
      
      expect(config.networking.createNatGateways).toBe(false);
      expect(config.networking.createVpcEndpoints).toBe(false);
      expect(config.certificate.transparencyLoggingEnabled).toBe(false);
      expect(config.general.enableContainerInsights).toBe(false);
      expect(config.kms.enableKeyRotation).toBe(false);
      expect(config.s3.enableVersioning).toBe(false);
      expect(config.ecr.scanOnPush).toBe(false);
    });

    it('prod has high-availability and security defaults', () => {
      const config = PROD_CONFIG;
      
      expect(config.networking.createNatGateways).toBe(true);
      expect(config.networking.createVpcEndpoints).toBe(true);
      expect(config.certificate.transparencyLoggingEnabled).toBe(true);
      expect(config.general.enableContainerInsights).toBe(true);
      expect(config.kms.enableKeyRotation).toBe(true);
      expect(config.s3.enableVersioning).toBe(true);
      expect(config.ecr.scanOnPush).toBe(true);
    });

    it('staging has production-like but cost-optimized defaults', () => {
      const config = STAGING_CONFIG;
      
      expect(config.networking.createNatGateways).toBe(true); // Test HA
      expect(config.networking.createVpcEndpoints).toBe(false); // Cost optimization
      expect(config.certificate.transparencyLoggingEnabled).toBe(true); // Test prod setup
      expect(config.general.enableContainerInsights).toBe(true); // Test monitoring
      expect(config.kms.enableKeyRotation).toBe(false); // Cost optimization
      expect(config.s3.enableVersioning).toBe(true); // Test versioning
      expect(config.ecr.scanOnPush).toBe(true); // Test security
    });
  });
});
