import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';
import { getResourceByType, getOutputByName } from './utils';

describe('TAK Base Infra CDK Stack', () => {
  it('creates VPC and subnets', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod', vpcLocationId: 1 });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true
    });
  });

  it('creates ECS cluster, ECR repo, KMS key/alias, and S3 bucket', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.resourceCountIs('AWS::KMS::Alias', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      OwnershipControls: {
        Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }]
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

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

  it('creates all expected outputs', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack);
    const outputs = template.toJSON().Outputs;
    [
      'VpcIdOutput', 'VpcCidrIpv4Output', 'VpcCidrIpv6Output',
      'SubnetPublicAOutput', 'SubnetPublicBOutput', 'SubnetPrivateAOutput', 'SubnetPrivateBOutput',
      'EcsArnOutput', 'EcrArnOutput', 'KmsArnOutput', 'ConfigBucketArnOutput'
    ].forEach(name => {
      expect(outputs[name]).toBeDefined();
    });
  });

  it('uses default parameters if not provided', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  it('synthesizes without errors', () => {
    const app = new cdk.App();
    expect(() => new CdkStack(app, 'TestStack', { envType: 'prod' })).not.toThrow();
  });

  it('all names, tags, and output export names use { Ref: "AWS::StackName" } dynamically', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack).toJSON();
    // Check all Name tags
    const resources = Object.values(template.Resources || {}) as any[];
    for (const res of resources) {
      if (res.Properties && res.Properties.Tags) {
        for (const tag of res.Properties.Tags) {
          if (tag.Key === 'Name') {
            const v = tag.Value;
            const isDynamic = (typeof v === 'object' && (
              (v.Ref === 'AWS::StackName') ||
              (v['Fn::Join'] && v['Fn::Join'][1] && v['Fn::Join'][1].some((x:any) => x && x.Ref === 'AWS::StackName'))
            ));
            expect(isDynamic).toBe(true);
          }
        }
      }
    }
    // Check all output export names
    const outputs = template.Outputs || {};
    for (const out of Object.values(outputs) as any[]) {
      if (out.Export && out.Export.Name) {
        const v = out.Export.Name;
        const isDynamic = (typeof v === 'object' && (
          (v.Ref === 'AWS::StackName') ||
          (v['Fn::Join'] && v['Fn::Join'][1] && v['Fn::Join'][1].some((x:any) => x && x.Ref === 'AWS::StackName'))
        ));
        expect(isDynamic).toBe(true);
      }
    }
  });
});
