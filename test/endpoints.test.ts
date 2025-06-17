import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { getResourceByType, CloudFormationResource, createTestApp } from './utils';

describe('VPC Endpoints', () => {
  it('creates S3 gateway endpoint and prod interface endpoints', () => {
    // Use the test app utility with proper context
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
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
    expect(endpoints.some((ep: CloudFormationResource) => ep.Properties?.VpcEndpointType === 'Interface')).toBe(true);
  });

  it('does not create interface endpoints in dev-test', () => {
    // Use the test app utility with proper context
    const app = createTestApp();
    const envConfig = app.node.tryGetContext('dev-test');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // No interface endpoints should exist in dev-test
    const interfaceEndpoints = endpoints.filter((ep: CloudFormationResource) => ep.Properties?.VpcEndpointType === 'Interface');
    expect(interfaceEndpoints.length).toBe(0);
    expect(interfaceEndpoints.length).toBe(0);
  });

  it('supports individual createVpcEndpoints parameter override', () => {
    // Test that individual parameter overrides work regardless of envType
    const app = createTestApp();
    
    // Create custom envConfig with overrides (normally dev-test doesn't create VPC endpoints)
    const envConfig = {
      ...app.node.tryGetContext('dev-test'),
      networking: {
        ...app.node.tryGetContext('dev-test').networking,
        createVpcEndpoints: true // Override to enable VPC endpoints
      }
    };
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // Interface endpoints should exist due to override
    expect(endpoints.some((ep: CloudFormationResource) => ep.Properties?.VpcEndpointType === 'Interface')).toBe(true);
  });
});
