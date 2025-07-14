import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('Stack Outputs', () => {
  it('creates all expected outputs including ACM certificate', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const outputs = template.toJSON().Outputs;
    [
      'VpcIdOutput', 'VpcCidrIpv4Output',
      'SubnetPublicAOutput', 'SubnetPublicBOutput', 'SubnetPrivateAOutput', 'SubnetPrivateBOutput',
      'EcsClusterArnOutput', 'KmsKeyArnOutput', 'KmsAliasOutput',
      'EnvConfigBucketOutput', 'AppImagesBucketOutput', 'ElbLogsBucketOutput',
      'CertificateArnOutput', 'HostedZoneIdOutput', 'HostedZoneNameOutput'
    ].forEach(name => {
      expect(outputs[name]).toBeDefined();
    });
  });

  it('creates IPv6 outputs (always enabled)', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('dev-test');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const outputs = template.toJSON().Outputs;
    
    expect(outputs['VpcCidrIpv6Output']).toBeDefined();
  });

  it('creates IPv6 output with proper structure', () => {
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const outputs = template.toJSON().Outputs;
    
    expect(outputs['VpcCidrIpv6Output']).toBeDefined();
    expect(outputs['VpcCidrIpv6Output'].Description).toBe('VPC IPv6 CIDR Block');
  });
});
