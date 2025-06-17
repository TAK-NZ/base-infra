#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';

const app = new cdk.App();

// Get environment from context (defaults to dev-test)
const envName = app.node.tryGetContext('env') || 'dev-test';

// Get the environment configuration from context
// CDK automatically handles context overrides via --context flag
const envConfig = app.node.tryGetContext(envName);
const defaults = app.node.tryGetContext('tak-defaults');

if (!envConfig) {
  throw new Error(`
❌ Environment configuration for '${envName}' not found in cdk.json

Usage:
  npx cdk deploy --context env=dev-test
  npx cdk deploy --context env=prod

Expected cdk.json structure:
{
  "context": {
    "dev-test": { ... },
    "prod": { ... }
  }
}
  `);
}

// Apply context overrides for individual parameters
// This allows --context r53ZoneName=custom.domain.com to override the config
const finalEnvConfig = {
  ...envConfig,
  // Override individual parameters if provided via --context
  r53ZoneName: app.node.tryGetContext('r53ZoneName') || envConfig.r53ZoneName,
  vpcCidr: app.node.tryGetContext('vpcCidr') || envConfig.vpcCidr,
  stackName: app.node.tryGetContext('stackName') || envConfig.stackName,
};

// Create stack name
const stackName = `TAK-${finalEnvConfig.stackName}-BaseInfra`;

// Create the stack
const stack = new BaseInfraStack(app, stackName, {
  environment: envName as 'prod' | 'dev-test',
  envConfig: finalEnvConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || defaults?.region || 'ap-southeast-2',
  },
  tags: {
    Project: defaults?.project || 'TAK',
    Environment: finalEnvConfig.stackName,
    Component: defaults?.component || 'BaseInfra',
    ManagedBy: 'CDK'
  }
});
