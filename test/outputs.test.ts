import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';

describe('Stack Outputs', () => {
  it('creates all expected outputs', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);
    const outputs = template.toJSON().Outputs;
    [
      'VpcIdOutput', 'VpcCidrIpv4Output', 'VpcCidrIpv6Output',
      'SubnetPublicAOutput', 'SubnetPublicBOutput', 'SubnetPrivateAOutput', 'SubnetPrivateBOutput',
      'EcsArnOutput', 'EcrArnOutput', 'KmsArnOutput', 'ConfigBucketArnOutput'
    ].forEach(name => {
      expect(outputs[name]).toBeDefined();
    });
  });
});
