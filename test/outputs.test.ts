import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('Stack Outputs', () => {
  it('creates all expected outputs including ACM certificate', () => {
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
    const template = Template.fromStack(stack as unknown as cdk.Stack);
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
