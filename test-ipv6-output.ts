import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from './lib/base-infra-stack';

// Create a test app
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

// Create the stack
const stack = new BaseInfraStack(app, 'TestStack', { 
  envType: 'prod',
  env: { account: '123456789012', region: 'us-east-1' }
});

// Get the template
const template = Template.fromStack(stack);
const outputs = template.toJSON().Outputs;

// Check for IPv6 output
if (outputs.VpcCidrIpv6Output) {
  console.log('✅ IPv6 CIDR output is present!');
  console.log('IPv6 Output:', JSON.stringify(outputs.VpcCidrIpv6Output, null, 2));
  console.log('Export Name:', outputs.VpcCidrIpv6Output.Export?.Name);
} else {
  console.log('❌ IPv6 CIDR output is missing');
}

// List all outputs for reference
console.log('\nAll outputs:');
Object.keys(outputs).forEach(key => {
  console.log(`- ${key}`);
});
