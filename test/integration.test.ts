import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('Integration Tests', () => {
  it('synthesizes without errors', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App();
    const stack = new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
    expect(() => stack).not.toThrow();
  });
});
