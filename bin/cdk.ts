#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { generateStackName, FIXED_STACK_CONFIG } from '../lib/stack-naming';

const app = new cdk.App();

// Read project tag with cascading priority:
// Priority: 1. Environment Variables, 2. CLI Context, 3. Defaults
const projectTag = process.env.PROJECT || 
                   app.node.tryGetContext('project') || 
                   FIXED_STACK_CONFIG.PROJECT;

const envType = process.env.ENV_TYPE || 
               app.node.tryGetContext('envType') || 
               'dev-test';

const stackNameSuffix = process.env.STACK_NAME || 
                       app.node.tryGetContext('stackName') || 
                       'MyFirstStack';

const vpcMajorId = parseInt(
  process.env.VPC_MAJOR_ID || 
  app.node.tryGetContext('vpcMajorId') || 
  '0', 10
);

const vpcMinorId = parseInt(
  process.env.VPC_MINOR_ID || 
  app.node.tryGetContext('vpcMinorId') || 
  '0', 10
);

// Generate consistent stack name using the utility function
const stackName = generateStackName({
  project: FIXED_STACK_CONFIG.PROJECT,
  environment: stackNameSuffix,  // Use stackName from config, not envType
  component: FIXED_STACK_CONFIG.COMPONENT
});

// Tag every resource in the stack with the project name
cdk.Tags.of(app).add("Project", projectTag);

new BaseInfraStack(app, stackName, {
  envType: envType as 'prod' | 'dev-test',
  vpcMajorId,
  vpcMinorId,
  
  // Environment can be resolved from AWS profile or environment variables
  // Route 53 hosted zone lookups require explicit account/region specification
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.CDK_DEPLOY_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.CDK_DEPLOY_REGION || 'ap-southeast-2'
  },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});