import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

function elbPolicy(region: string): { json: string; statements: any[] } {
  const app = createTestApp();
  const envConfig = app.node.tryGetContext('prod');
  const stack = new BaseInfraStack(app, 'TestStack', {
    environment: 'prod',
    envConfig: envConfig,
    env: { account: '123456789012', region }
  });
  const template = Template.fromStack(stack);
  const policy = template.findResources('AWS::S3::BucketPolicy')['ElbLogsBucketPolicy90E80978'];
  return { json: JSON.stringify(policy), statements: policy.Properties.PolicyDocument.Statement };
}

describe('ELB log bucket policy', () => {
  it('grants only the deployment region ELB account in a legacy commercial region', () => {
    const { json } = elbPolicy('us-east-1');
    expect(json).toContain('arn:aws:iam::127311923021:root');
    // No other region's ELB account
    expect(json).not.toContain('783225319266');
    expect(json).not.toContain('arn:aws-us-gov:iam::');
  });

  it('grants only the deployment region ELB account in a GovCloud region', () => {
    const { json } = elbPolicy('us-gov-west-1');
    expect(json).toContain('arn:aws-us-gov:iam::048591011584:root');
    expect(json).not.toContain('190560391635');
    expect(json).not.toContain('arn:aws:iam::127311923021');
  });

  it('has no legacy ELB account principal in Auckland (ap-southeast-6) and still allows log delivery', () => {
    const { json, statements } = elbPolicy('ap-southeast-6');
    expect(json).not.toMatch(/arn:aws:iam::\d{12}:root/);
    const albDelivery = statements.find(s =>
      s.Principal?.Service === 'logdelivery.elasticloadbalancing.amazonaws.com');
    expect(albDelivery).toBeDefined();
    expect(albDelivery.Action).toBe('s3:PutObject');
  });

  it('restricts log object writes to this account\'s AWSLogs path', () => {
    const { statements } = elbPolicy('us-east-1');
    const writers = statements.filter(s =>
      s.Action === 's3:PutObject' &&
      (s.Principal?.Service !== undefined || s.Principal?.AWS === 'arn:aws:iam::127311923021:root'));
    expect(writers.length).toBeGreaterThanOrEqual(3);
    for (const w of writers) {
      expect(JSON.stringify(w.Resource)).toContain('/AWSLogs/');
      expect(JSON.stringify(w.Resource)).toContain('AWS::AccountId');
    }
  });
});
