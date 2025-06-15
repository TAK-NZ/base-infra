import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('AWS Resources', () => {
  it('creates ECS cluster, ECR repo, KMS key/alias, S3 bucket, and ACM certificate', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App({
      context: {
        r53ZoneName: 'example.com',
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    const stack = new BaseInfraStack(app, 'TestStack', { 
      envType: 'prod',
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.resourceCountIs('AWS::KMS::Alias', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      OwnershipControls: {
        Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }]
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });
});
