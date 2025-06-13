import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('Stack Outputs', () => {
  it('creates all expected outputs', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App();
    const stack = new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack as unknown as cdk.Stack);
    const outputs = template.toJSON().Outputs;
    [
      'VpcIdOutput', 'VpcCidrIpv4Output',
      'SubnetPublicAOutput', 'SubnetPublicBOutput', 'SubnetPrivateAOutput', 'SubnetPrivateBOutput',
      'EcsArnOutput', 'EcrArnOutput', 'KmsArnOutput', 'ConfigBucketArnOutput'
    ].forEach(name => {
      expect(outputs[name]).toBeDefined();
    });
  });
});

// Remove or update tests that depend on parameterization/config logic. Use direct values or context for output tests.
