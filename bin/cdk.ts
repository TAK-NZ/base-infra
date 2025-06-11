#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { ParameterResolver } from '../lib/parameter-resolver';
import { generateStackName, FIXED_STACK_CONFIG } from '../lib/stack-naming';

const app = new cdk.App();

// Create parameter resolver to read from cdk-config.json
const resolver = new ParameterResolver();

// Read project tag with cascading priority: context -> env -> config -> default
const projectTag = app.node.tryGetContext('project') || 
                   process.env.PROJECT || 
                   resolver.getConfigValue('project') || 
                   FIXED_STACK_CONFIG.PROJECT;

cdk.Tags.of(app).add("Project", projectTag);

// Get environment type (this will become a CloudFormation parameter)
const envType = app.node.tryGetContext('envType') || process.env.ENV_TYPE || 'dev-test';

// Get stack name suffix for the environment part (from config file)
const stackNameSuffix = app.node.tryGetContext('stackName') || 
                       process.env.STACK_NAME_SUFFIX || 
                       resolver.getConfigValue('stackName') || 
                       'DevTest';

// Generate consistent stack name using the utility function
const stackName = generateStackName({
  project: FIXED_STACK_CONFIG.PROJECT,
  environment: stackNameSuffix,  // Use stackName from config, not envType
  component: FIXED_STACK_CONFIG.COMPONENT
});

new CdkStack(app, stackName, {
  envType: envType as 'prod' | 'dev-test',
  vpcMajorId: parseInt(app.node.tryGetContext('vpcMajorId') || process.env.VPC_MAJOR_ID || '0', 10),
  vpcMinorId: parseInt(app.node.tryGetContext('vpcMinorId') || process.env.VPC_MINOR_ID || '0', 10),
  
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