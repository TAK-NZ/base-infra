import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createStackConfig } from '../lib/stack-config';
import { getResourceByType } from './utils';

describe('VPC Endpoints', () => {
  it('creates S3 gateway endpoint and prod interface endpoints', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    const config = createStackConfig('prod', 'example.com');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      configResult: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
      ServiceName: { 'Fn::Join': [ '', [ 'com.amazonaws.', { Ref: 'AWS::Region' }, '.s3' ] ] }
    });
    // Interface endpoints (prod)
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // At least one interface endpoint should exist
    expect(endpoints.some((ep: any) => ep.Properties.VpcEndpointType === 'Interface')).toBe(true);
  });

  it('does not create interface endpoints in dev-test', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    const config = createStackConfig('dev-test', 'example.com');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      configResult: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // No interface endpoints should exist in dev-test
    const interfaceEndpoints = endpoints.filter((ep: any) => ep.Properties.VpcEndpointType === 'Interface');
    expect(interfaceEndpoints.length).toBe(0);
    expect(interfaceEndpoints.length).toBe(0);
  });

  it('supports individual createVpcEndpoints parameter override', () => {
    // Test that individual parameter overrides work regardless of envType
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    // Create config with override to create VPC endpoints (normally not created in dev-test)
    const config = createStackConfig('dev-test', 'example.com', {
      networking: { createVpcEndpoints: true }
    });
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      configResult: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // Interface endpoints should exist due to override
    expect(endpoints.some((ep: any) => ep.Properties.VpcEndpointType === 'Interface')).toBe(true);
  });
});
