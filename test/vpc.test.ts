import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';

describe('VPC and Networking', () => {
  it('creates VPC and subnets', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true
    });
  });
});
