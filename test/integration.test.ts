import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

describe('Integration Tests', () => {
  it('synthesizes without errors', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    expect(() => stack).not.toThrow();
  });
});
