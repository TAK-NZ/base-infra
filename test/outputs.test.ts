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
      'VpcIdOutput', 'VpcCidrIpv4Output', 'VpcCidrIpv6Output',
      'SubnetPublicAOutput', 'SubnetPublicBOutput', 'SubnetPrivateAOutput', 'SubnetPrivateBOutput',
      'EcsArnOutput', 'EcrArnOutput', 'KmsArnOutput', 'ConfigBucketArnOutput',
      'CertificateArnOutput', 'HostedZoneIdOutput'
    ].forEach(name => {
      expect(outputs[name]).toBeDefined();
    });
  });
});

// Remove or update tests that depend on parameterization/config logic. Use direct values or context for output tests.
