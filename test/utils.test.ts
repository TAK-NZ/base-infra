import { validateEnvType, validateStackName, validateR53ZoneName, validateCdkContextParams, getGitSha } from '../lib/utils';

describe('Utils Library', () => {
  describe('validateEnvType', () => {
    it('accepts valid environment types', () => {
      expect(() => validateEnvType('prod')).not.toThrow();
      expect(() => validateEnvType('dev-test')).not.toThrow();
    });

    it('rejects invalid environment types', () => {
      expect(() => validateEnvType('invalid')).toThrow('Invalid envType: invalid. Must be \'prod\' or \'dev-test\'');
      expect(() => validateEnvType('staging')).toThrow('Invalid envType: staging. Must be \'prod\' or \'dev-test\'');
    });
  });

  describe('validateStackName', () => {
    it('accepts valid stack names', () => {
      expect(() => validateStackName('MyStack')).not.toThrow();
      expect(() => validateStackName('Test-Stack')).not.toThrow();
    });

    it('rejects empty or undefined stack names', () => {
      expect(() => validateStackName(undefined)).toThrow('stackName is required. Use --context stackName=YourStackName');
      expect(() => validateStackName('')).toThrow('stackName is required. Use --context stackName=YourStackName');
    });
  });

  describe('validateR53ZoneName', () => {
    it('accepts valid zone names', () => {
      expect(() => validateR53ZoneName('example.com')).not.toThrow();
      expect(() => validateR53ZoneName('sub.example.com')).not.toThrow();
    });

    it('rejects empty or undefined zone names', () => {
      expect(() => validateR53ZoneName(undefined)).toThrow('r53ZoneName is required. Use --context r53ZoneName=your.domain.com');
      expect(() => validateR53ZoneName('')).toThrow('r53ZoneName is required. Use --context r53ZoneName=your.domain.com');
    });
  });

  describe('validateCdkContextParams', () => {
    it('validates all parameters together', () => {
      expect(() => validateCdkContextParams({
        envType: 'prod',
        stackName: 'MyStack',
        r53ZoneName: 'example.com'
      })).not.toThrow();
    });

    it('throws on first invalid parameter', () => {
      expect(() => validateCdkContextParams({
        envType: 'invalid',
        stackName: 'MyStack',
        r53ZoneName: 'example.com'
      })).toThrow('Invalid envType');
    });
  });

  describe('getGitSha', () => {
    it('returns a string', () => {
      const sha = getGitSha();
      expect(typeof sha).toBe('string');
      expect(sha.length).toBeGreaterThan(0);
    });
  });
});
