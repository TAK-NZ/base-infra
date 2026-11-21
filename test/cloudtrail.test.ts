import { Match, Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { applyContextOverrides } from '../lib/utils/context-overrides';
import { createTestApp } from './utils';

function synth(envName: 'dev-test' | 'prod', configure?: (config: any) => void, contextOverrides?: Record<string, unknown>) {
  const app = createTestApp();
  if (contextOverrides) {
    Object.entries(contextOverrides).forEach(([key, value]) => app.node.setContext(key, value));
  }
  const envConfig = applyContextOverrides(app, JSON.parse(JSON.stringify(app.node.tryGetContext(envName))));
  configure?.(envConfig);
  const stack = new BaseInfraStack(app, 'TestStack', {
    environment: envName,
    envConfig,
    env: { account: '123456789012', region: 'ap-southeast-2' }
  });
  return Template.fromStack(stack);
}

describe('CloudTrail', () => {
  describe('when enabled (default)', () => {
    const template = synth('dev-test');

    it('creates one single-Region trail logging read and write management events', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsLogging: true,
        IsMultiRegionTrail: false,
        IncludeGlobalServiceEvents: false,
        EnableLogFileValidation: true,
        EventSelectors: [{ ReadWriteType: 'All', IncludeManagementEvents: true }],
      });
    });

    it('stores logs in a secured, S3-managed-encryption bucket that is retained', () => {
      const buckets = template.findResources('AWS::S3::Bucket', {
        Properties: {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }]
          }
        }
      });
      const entries = Object.entries(buckets).filter(([id]) => id.startsWith('CloudTrailLogsBucket'));
      expect(entries).toHaveLength(1);
      const [, bucket] = entries[0] as [string, any];
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
      expect(bucket.Properties.BucketName).toBeUndefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
      expect(bucket.Properties.LifecycleConfiguration.Rules).toEqual([
        { Id: 'ExpireCloudTrailLogs', ExpirationInDays: 90, Status: 'Enabled' }
      ]);
    });

    it('uses the configured log retention', () => {
      const custom = synth('dev-test', config => { config.cloudTrail.logRetentionDays = 365; });
      custom.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: { Rules: [Match.objectLike({ Id: 'ExpireCloudTrailLogs', ExpirationInDays: 365 })] }
      });
    });

    it('retains the log bucket even when the removal policy is DESTROY', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const trailBucket = Object.entries(buckets).find(([id]) => id.startsWith('CloudTrailLogsBucket'))![1] as any;
      expect(trailBucket.DeletionPolicy).toBe('Retain');
    });

    it('grants CloudTrail access scoped by source ARN and source account, and requires SSL', () => {
      const policies = template.findResources('AWS::S3::BucketPolicy');
      const policy = Object.entries(policies).find(([id]) => id.startsWith('CloudTrailLogsBucketPolicy'))![1] as any;
      const statements: any[] = policy.Properties.PolicyDocument.Statement;

      const cloudTrailStatements = statements.filter(s => s.Principal?.Service === 'cloudtrail.amazonaws.com');
      expect(cloudTrailStatements.map(s => s.Action).sort()).toEqual(['s3:GetBucketAcl', 's3:PutObject']);
      cloudTrailStatements.forEach(s => {
        expect(s.Effect).toBe('Allow');
        expect(s.Condition.StringEquals['aws:SourceArn']).toBeDefined();
        expect(JSON.stringify(s.Condition.StringEquals['aws:SourceArn'])).toContain(':cloudtrail:ap-southeast-2:123456789012:trail/TestStack-ManagementEvents');
        expect(s.Condition.StringEquals['aws:SourceAccount']).toEqual({ Ref: 'AWS::AccountId' });
      });
      const put = cloudTrailStatements.find(s => s.Action === 's3:PutObject');
      expect(put.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
      expect(JSON.stringify(put.Resource)).toContain('/AWSLogs/');

      const denyInsecure = statements.find(s => s.Effect === 'Deny' && s.Condition?.Bool?.['aws:SecureTransport'] === 'false');
      expect(denyInsecure).toBeDefined();
    });

    it('makes the trail depend on the bucket policy', () => {
      const trails = template.findResources('AWS::CloudTrail::Trail');
      const trail = Object.values(trails)[0] as any;
      expect(trail.DependsOn).toEqual(expect.arrayContaining([expect.stringMatching(/^CloudTrailLogsBucketPolicy/)]));
    });

    it('exports the trail name', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs['CloudTrailNameOutput']).toBeDefined();
      expect(outputs['CloudTrailNameOutput'].Value).toEqual({ Ref: 'ManagementEventsTrail' });
      expect(JSON.stringify(outputs['CloudTrailNameOutput'].Export.Name)).toContain('-CloudTrailName');
    });
  });

  describe('when disabled', () => {
    const assertNoCloudTrail = (template: Template) => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 0);
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).some(id => id.startsWith('CloudTrailLogsBucket'))).toBe(false);
      const policies = template.findResources('AWS::S3::BucketPolicy');
      expect(Object.keys(policies).some(id => id.startsWith('CloudTrailLogsBucketPolicy'))).toBe(false);
      expect(template.toJSON().Outputs['CloudTrailNameOutput']).toBeUndefined();
    };

    it('creates nothing when cloudTrail.enabled is false', () => {
      assertNoCloudTrail(synth('prod', config => { config.cloudTrail.enabled = false; }));
    });

    it('creates nothing with --context createCloudTrail=false', () => {
      assertNoCloudTrail(synth('prod', undefined, { createCloudTrail: 'false' }));
    });
  });
});
