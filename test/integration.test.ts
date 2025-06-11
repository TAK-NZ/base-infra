import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

describe('Integration Tests', () => {
  it('synthesizes without errors', () => {
    const app = new cdk.App();
    expect(() => new CdkStack(app, 'TestStack', { envType: 'prod' })).not.toThrow();
  });
});
