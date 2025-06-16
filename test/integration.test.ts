import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createStackConfig } from '../lib/stack-config';

describe('Integration Tests', () => {
  it('synthesizes without errors when R53 zone is provided', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    const config = createStackConfig('prod', 'example.com');
    const stack = new BaseInfraStack(app, 'TestStack', { 
      stackConfig: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    expect(() => stack).not.toThrow();
  });

  it('throws error when R53 zone is not provided', () => {
    const app = new cdk.App();
    expect(() => {
      createStackConfig('prod', ''); // Empty zone name should cause validation error
    }).toThrow('r53ZoneName is required');
  });
});
