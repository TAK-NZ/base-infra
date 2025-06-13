import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { getResourceByType } from './utils';

describe('VPC Endpoints', () => {
  it('creates S3 gateway endpoint and prod interface endpoints', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App();
    const stack = new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
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
    const app = new cdk.App();
    const stack = new BaseInfraStack(app, 'TestStack', { envType: 'dev-test' });
    const template = Template.fromStack(stack);
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // No interface endpoints should exist in dev-test
    const interfaceEndpoints = endpoints.filter((ep: any) => ep.Properties.VpcEndpointType === 'Interface');
    expect(interfaceEndpoints.length).toBe(0);
  });
});
