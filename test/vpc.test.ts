import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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

  it('creates IPv6 CIDR block (always enabled)', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('dev-test');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPCCidrBlock', 1);
  });

  it('creates IPv6 CIDR with proper configuration', () => {
    const app = createTestApp();
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
  describe('VPC Block Public Access exclusions', () => {
    const synth = (excludePublicSubnetsFromBpa?: boolean) => {
      const { createVpcL2Resources } = require('../lib/constructs/vpc');
      const app = createTestApp();
      const testStack = new cdk.Stack(app, 'TestStack');
      createVpcL2Resources(testStack, undefined, false, excludePublicSubnetsFromBpa);
      return Template.fromStack(testStack);
    };

    it('excludes each public subnet with a bidirectional exclusion by default', () => {
      const template = synth();
      template.resourceCountIs('AWS::EC2::VPCBlockPublicAccessExclusion', 2);
      template.hasResourceProperties('AWS::EC2::VPCBlockPublicAccessExclusion', {
        InternetGatewayExclusionMode: 'allow-bidirectional',
        SubnetId: { Ref: Match.stringLikeRegexp('^VpcpublicSubnet1Subnet') },
      });
      template.hasResourceProperties('AWS::EC2::VPCBlockPublicAccessExclusion', {
        SubnetId: { Ref: Match.stringLikeRegexp('^VpcpublicSubnet2Subnet') },
      });
    });

    it('does not exclude private subnets', () => {
      const template = synth(true);
      const exclusions = template.findResources('AWS::EC2::VPCBlockPublicAccessExclusion');
      Object.values(exclusions).forEach((r: any) => {
        expect(JSON.stringify(r.Properties.SubnetId)).not.toContain('privateSubnet');
      });
    });

    it('creates no exclusions when disabled', () => {
      synth(false).resourceCountIs('AWS::EC2::VPCBlockPublicAccessExclusion', 0);
    });

    it('does not manage the account-level BPA setting', () => {
      synth().resourceCountIs('AWS::EC2::VPCBlockPublicAccessOptions', 0);
    });
  });
});
