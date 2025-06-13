import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('AWS Resources', () => {
  it('creates ECS cluster, ECR repo, KMS key/alias, and S3 bucket', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App();
    const stack = new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.resourceCountIs('AWS::KMS::Alias', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
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
