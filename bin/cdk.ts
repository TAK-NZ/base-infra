#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createStackConfig } from '../lib/stack-config';
import { validateCdkContextParams } from '../lib/utils';

const app = new cdk.App();

// Read configuration from CDK context only (command line --context parameters)
const ProjectName = app.node.tryGetContext('project');
const customStackName = app.node.tryGetContext('stackName');
const envType = app.node.tryGetContext('envType') || 'dev-test';
const r53ZoneName = app.node.tryGetContext('r53ZoneName');

// Validate all required parameters using utils
validateCdkContextParams({
  envType,
  stackName: customStackName,
  r53ZoneName
});

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

// Create the stack name using the required customStackName
const stackName = `TAK-${customStackName}-BaseInfra`; // Always use TAK prefix

// Create complete configuration
const configResult = createStackConfig(
  envType as 'prod' | 'dev-test',
  r53ZoneName,
  Object.keys(overrides).length > 0 ? overrides : undefined,
  'TAK', // Always use TAK as project prefix
  'BaseInfra'
);

// Create the stack with environment configuration
const stack = new BaseInfraStack(app, stackName, {
  configResult: configResult,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
  },
  tags: {
    Project: ProjectName || 'TAK',
    Environment: customStackName,
    Component: 'BaseInfra',
    ManagedBy: 'CDK'
  }
});