#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { ParameterResolver } from '../lib/parameter-resolver';
import { generateStackName, FIXED_STACK_CONFIG } from '../lib/stack-naming';

const app = new cdk.App();

// Create parameter resolver to read from cdk-config.json
const resolver = new ParameterResolver();

// Read project tag with cascading priority:
// Priority: 1. Environment Variables, 2. CLI Context, 3. Config File, 4. Defaults
const projectTag = process.env.PROJECT || 
                   app.node.tryGetContext('project') || 
                   resolver.getConfigValue('project') || 
                   FIXED_STACK_CONFIG.PROJECT;

const envType = process.env.ENV_TYPE || 
               app.node.tryGetContext('envType') || 
               resolver.getConfigValue('envType') || 
               'dev-test';

const stackNameSuffix = process.env.STACK_NAME_SUFFIX || 
                       app.node.tryGetContext('stackName') || 
                       resolver.getConfigValue('stackName') || 
                       'devtest';

const vpcMajorId = parseInt(
  process.env.VPC_MAJOR_ID || 
  app.node.tryGetContext('vpcMajorId') || 
  resolver.getConfigValue('vpcMajorId') || 
  '0', 10
);

const vpcMinorId = parseInt(
  process.env.VPC_MINOR_ID || 
  app.node.tryGetContext('vpcMinorId') || 
  resolver.getConfigValue('vpcMinorId') || 
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

new CdkStack(app, stackName, {
  envType: envType as 'prod' | 'dev-test',
  vpcMajorId,
  vpcMinorId,
  resolver, // Pass the resolver instance to avoid duplicate creation
  
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});