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

// Apply context overrides for non-prefixed parameters
// This supports direct overrides that work for any environment:
// --context r53ZoneName=custom.domain.com
// --context networking.createNatGateways=true
// --context certificate.transparencyLoggingEnabled=false
const finalEnvConfig = {
  ...envConfig,
  // Override top-level parameters
  r53ZoneName: app.node.tryGetContext('r53ZoneName') || envConfig.r53ZoneName,
  vpcCidr: app.node.tryGetContext('vpcCidr') || envConfig.vpcCidr,
  stackName: app.node.tryGetContext('stackName') || envConfig.stackName,
  
  // Override nested parameters
  networking: {
    ...envConfig.networking,
    createNatGateways: app.node.tryGetContext('networking.createNatGateways') ?? envConfig.networking.createNatGateways,
    createVpcEndpoints: app.node.tryGetContext('networking.createVpcEndpoints') ?? envConfig.networking.createVpcEndpoints,
  },
  certificate: {
    ...envConfig.certificate,
    transparencyLoggingEnabled: app.node.tryGetContext('certificate.transparencyLoggingEnabled') ?? envConfig.certificate.transparencyLoggingEnabled,
  },
  general: {
    ...envConfig.general,
    removalPolicy: app.node.tryGetContext('general.removalPolicy') || envConfig.general.removalPolicy,
    enableDetailedLogging: app.node.tryGetContext('general.enableDetailedLogging') ?? envConfig.general.enableDetailedLogging,
    enableContainerInsights: app.node.tryGetContext('general.enableContainerInsights') ?? envConfig.general.enableContainerInsights,
  },
  kms: {
    ...envConfig.kms,
    enableKeyRotation: app.node.tryGetContext('kms.enableKeyRotation') ?? envConfig.kms.enableKeyRotation,
  },
  s3: {
    ...envConfig.s3,
    enableVersioning: app.node.tryGetContext('s3.enableVersioning') ?? envConfig.s3.enableVersioning,
    lifecycleRules: app.node.tryGetContext('s3.lifecycleRules') ?? envConfig.s3.lifecycleRules,
  },
  ecr: {
    ...envConfig.ecr,
    imageRetentionCount: app.node.tryGetContext('ecr.imageRetentionCount') ?? envConfig.ecr.imageRetentionCount,
    scanOnPush: app.node.tryGetContext('ecr.scanOnPush') ?? envConfig.ecr.scanOnPush,
  },
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
