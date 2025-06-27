#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { applyContextOverrides } from '../lib/utils/context-overrides';
import { DEFAULT_AWS_REGION } from '../lib/utils/constants';
import { generateStandardTags } from '../lib/utils/tag-helpers';

const app = new cdk.App();

// Get environment from context (defaults to dev-test)
const envName = app.node.tryGetContext('envType') || 'dev-test';

// Get the environment configuration from context
// CDK automatically handles context overrides via --context flag
const envConfig = app.node.tryGetContext(envName);
const defaults = app.node.tryGetContext('tak-defaults');

if (!envConfig) {
  throw new Error(`
❌ Environment configuration for '${envName}' not found in cdk.json

Usage:
  npx cdk deploy --context envType=dev-test
  npx cdk deploy --context envType=prod

Expected cdk.json structure:
{
  "context": {
    "dev-test": { ... },
    "prod": { ... }
  }
}
  `);
}

// Apply context overrides for non-prefixed parameters
// This supports direct overrides that work for any environment:
// --context r53ZoneName=custom.domain.com
// --context networking.createNatGateways=true
// --context certificate.transparencyLoggingEnabled=false
const finalEnvConfig = applyContextOverrides(app, envConfig);

// Create stack name
const stackName = `TAK-${finalEnvConfig.stackName}-BaseInfra`;

// Create the stack
const stack = new BaseInfraStack(app, stackName, {
  environment: envName as 'prod' | 'dev-test',
  envConfig: finalEnvConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || defaults?.region || DEFAULT_AWS_REGION,
  },
  tags: generateStandardTags(finalEnvConfig, envName as 'prod' | 'dev-test', defaults)
});
