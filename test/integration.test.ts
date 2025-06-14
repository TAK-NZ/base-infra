import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('Integration Tests', () => {
  it('synthesizes without errors when R53 zone is provided', () => {
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
    expect(() => stack).not.toThrow();
  });

  it('throws error when R53 zone is not provided', () => {
    const app = new cdk.App();
    expect(() => {
      new BaseInfraStack(app, 'TestStack', { 
        envType: 'prod',
        env: { account: '123456789012', region: 'us-east-1' }
      });
    }).toThrow('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');
  });
});
