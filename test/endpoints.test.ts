import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';
import { getResourceByType } from './utils';

describe('VPC Endpoints', () => {
  it('creates S3 gateway endpoint and prod interface endpoints', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
      ServiceName: { 'Fn::Join': [ '', [ 'com.amazonaws.', { Ref: 'AWS::Region' }, '.s3' ] ] }
    });
    // Interface endpoints (prod)
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // At least one interface endpoint should exist and have Condition: 'CreateProdResources'
    expect(endpoints.some((ep: any) => ep.Properties.VpcEndpointType === 'Interface' && ep.Condition === 'CreateProdResources')).toBe(true);
  });

  it('does not create interface endpoints in dev-test', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'dev-test' });
    const template = Template.fromStack(stack);
    const endpoints = getResourceByType(template.toJSON(), 'AWS::EC2::VPCEndpoint');
    // All interface endpoints, if present, must have Condition: 'CreateProdResources'
    const interfaceEndpoints = endpoints.filter((ep: any) => ep.Properties.VpcEndpointType === 'Interface');
    expect(interfaceEndpoints.every((ep: any) => ep.Condition === 'CreateProdResources')).toBe(true);
  });
});
