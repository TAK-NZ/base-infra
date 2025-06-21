import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('Integration Tests', () => {
  it('synthesizes without errors when R53 zone is provided', () => {
    // Use the test app utility with proper context
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    expect(() => stack).not.toThrow();
  });

  it('throws error when R53 zone is not provided', () => {
    const app = new cdk.App();
    const invalidEnvConfig = {
      stackName: 'Test',
      r53ZoneName: '', // Empty zone name should cause validation error
      networking: { enableRedundantNatGateways: false, createVpcEndpoints: false },
      certificate: { transparencyLoggingEnabled: false },
      general: { removalPolicy: 'DESTROY' },
      kms: { enableKeyRotation: false },
      s3: { enableVersioning: false }
    };
    
    expect(() => {
      new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: invalidEnvConfig
      });
    }).toThrow('R53 zone name is required for ACM certificate creation');
  });
});
