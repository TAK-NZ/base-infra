import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('VPC and Networking', () => {
  it('creates VPC and subnets', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true
    });
  });

  it('does not create IPv6 CIDR when context not enabled', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('dev-test');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPCCidrBlock', 0);
  });

  it('creates IPv6 CIDR when enableIpv6 context is true', () => {
    const app = createTestApp();
    app.node.setContext('enableIpv6', true);
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPCCidrBlock', 1);
    template.hasResourceProperties('AWS::EC2::VPCCidrBlock', {
      AmazonProvidedIpv6CidrBlock: true
    });
  });

  it('uses default VPC CIDR when not specified', () => {
    const { createVpcL2Resources } = require('../lib/constructs/vpc');
    const app = createTestApp();
    const testStack = new cdk.Stack(app, 'TestStack');
    
    // Test with undefined vpcCidr (should use default)
    const result = createVpcL2Resources(testStack, undefined, false);
    
    expect(result.vpc).toBeDefined();
    expect(result.vpcLogicalId).toBeDefined();
  });

  it('uses custom VPC CIDR when specified', () => {
    const { createVpcL2Resources } = require('../lib/constructs/vpc');
    const app = createTestApp();
    const testStack = new cdk.Stack(app, 'TestStack');
    
    // Test with custom vpcCidr
    const result = createVpcL2Resources(testStack, '192.168.0.0/16', true);
    
    expect(result.vpc).toBeDefined();
    expect(result.vpcLogicalId).toBeDefined();
    
    const template = Template.fromStack(testStack);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '192.168.0.0/16'
    });
  });
});
