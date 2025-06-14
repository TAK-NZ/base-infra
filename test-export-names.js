#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { BaseInfraStack } = require('./lib/base-infra-stack');

const app = new cdk.App({
  context: {
    r53ZoneName: 'example.com',
    // Mock the hosted zone lookup to avoid AWS calls
    'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
      Id: '/hostedzone/Z1PA6795UKMFR9',
      Name: 'example.com.'
    }
  }
});

const stack = new BaseInfraStack(app, 'TAK-DevTest-BaseInfra', { 
  envType: 'dev-test',
  env: { account: '123456789012', region: 'us-east-1' }
});

// Synthesize and get the template
const template = app.synth().getStackByName('TAK-DevTest-BaseInfra').template;
const outputs = template.Outputs || {};

console.log('Export Names:');
console.log('=============');

// Extract and display export names
Object.keys(outputs).forEach(key => {
  const output = outputs[key];
  if (output.Export && output.Export.Name) {
    const exportName = output.Export.Name;
    if (typeof exportName === 'object' && exportName['Fn::Sub']) {
      console.log(`${key}: ${exportName['Fn::Sub']}`);
    } else {
      console.log(`${key}: ${exportName}`);
    }
  }
});

console.log('\nExpected pattern: TAK-DevTest-BaseInfra-XXX');
