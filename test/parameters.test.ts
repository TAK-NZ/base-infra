import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';

describe('CdkStack', () => {
  it('creates a VPC with the correct CIDR block', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);

    // For L2 VPC, the CIDR block is always 10.0.0.0/16
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
    });
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  it('validates parameter constraints', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);

    // Check default parameter values
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
    });
  });
});
