#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createStackConfig } from '../lib/stack-config';

const app = new cdk.App();

// Read configuration from CDK context only (command line --context parameters)
const ProjectName = app.node.tryGetContext('project');
const customStackName = app.node.tryGetContext('stackName');
const envType = app.node.tryGetContext('envType') || 'dev-test';
const r53ZoneName = app.node.tryGetContext('r53ZoneName');

// Validate envType
if (envType !== 'prod' && envType !== 'dev-test') {
  throw new Error(`Invalid envType: ${envType}. Must be 'prod' or 'dev-test'`);
}

// Validate required parameters
if (!r53ZoneName) {
  throw new Error('r53ZoneName is required. Use --context r53ZoneName=your.domain.com');
}

// Read optional context overrides
const overrides = {
  ...(app.node.tryGetContext('vpcMajorId') && {
    networking: { vpcMajorId: parseInt(app.node.tryGetContext('vpcMajorId'), 10) }
  }),
  ...(app.node.tryGetContext('vpcMinorId') && {
    networking: { vpcMinorId: parseInt(app.node.tryGetContext('vpcMinorId'), 10) }
  }),
  ...(app.node.tryGetContext('createNatGateways') !== undefined && {
    networking: { createNatGateways: app.node.tryGetContext('createNatGateways') === 'true' }
  }),
  ...(app.node.tryGetContext('createVpcEndpoints') !== undefined && {
    networking: { createVpcEndpoints: app.node.tryGetContext('createVpcEndpoints') === 'true' }
  }),
};

// Create configuration
const config = createStackConfig(
  envType as 'prod' | 'dev-test',
  r53ZoneName,
  Object.keys(overrides).length > 0 ? overrides : undefined,
  'TAK', // Always use TAK as project prefix
  'BaseInfra'
);

// Create the stack with environment configuration for AWS API calls only
const environmentName = customStackName || (config.envType === 'prod' ? 'Prod' : 'Dev');
const stackName = `TAK-${environmentName}-BaseInfra`; // Always use TAK prefix

const stack = new BaseInfraStack(app, stackName, {
  stackConfig: config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
  },
  tags: {
    Project: ProjectName || 'TAK',
    'Environment-Name': environmentName,
    Component: 'BaseInfra',
    ManagedBy: 'CDK',
    'DNS-Zone': r53ZoneName,
  }
});