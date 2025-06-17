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

// Create stack name
const stackName = `TAK-${envConfig.stackName}-BaseInfra`;

// Create the stack
const stack = new BaseInfraStack(app, stackName, {
  environment: envName as 'prod' | 'dev-test',
  envConfig: envConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || defaults?.region || 'ap-southeast-2',
  },
  tags: {
    Project: defaults?.project || 'TAK',
    Environment: envConfig.stackName,
    Component: defaults?.component || 'BaseInfra',
    ManagedBy: 'CDK'
  }
});
