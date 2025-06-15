#!/usr/bin/env node

// Set the environment variable
process.env.ENV_TYPE = 'prod';
process.env.R53_ZONE_NAME = 'example.com';

const { resolveStackParameters } = require('./lib/parameters');
const cdk = require('aws-cdk-lib');

// Create a mock stack to test parameter resolution
const app = new cdk.App();
const stack = new cdk.Stack(app, 'TestStack', {
  env: { account: '123456789012', region: 'us-east-1' }
});

try {
  const params = resolveStackParameters(stack);
  console.log('Resolved parameters:');
  console.log(JSON.stringify(params, null, 2));
} catch (error) {
  console.error('Error resolving parameters:', error.message);
}
