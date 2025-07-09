import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('ELB Service Account Partition Filtering', () => {
  it('filters to commercial region principals only for commercial regions', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    
    // Should have commercial ELB service account principals only
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
    const elbBucketPolicy = bucketPolicies['ElbLogsBucketPolicy90E80978'];
    const principals = JSON.stringify(elbBucketPolicy);
    
    expect(principals).toContain('arn:aws:iam::');
    expect(principals).not.toContain('arn:aws-us-gov:iam::');
  });

  it('filters to GovCloud region principals only for GovCloud regions', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-gov-west-1' }
    });
    const template = Template.fromStack(stack);
    
    // Should have GovCloud ELB service account principals only
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
    const elbBucketPolicy = bucketPolicies['ElbLogsBucketPolicy90E80978'];
    const principals = JSON.stringify(elbBucketPolicy);
    
    expect(principals).toContain('arn:aws-us-gov:iam::');
    expect(principals).not.toContain('arn:aws:iam::');
  });

  it('does not mix commercial and GovCloud principals', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    
    // Should not have GovCloud principals in commercial region deployment
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
    const policyStatements = JSON.stringify(bucketPolicies);
    
    expect(policyStatements).not.toContain('arn:aws-us-gov:iam::');
    expect(policyStatements).toContain('arn:aws:iam::');
  });
});