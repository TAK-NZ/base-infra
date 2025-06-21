import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('ACM Certificate', () => {
  it('creates ACM certificate with correct domain names when R53 zone is provided', () => {
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        },
        'prod': {
          stackName: 'Prod',
          r53ZoneName: 'example.com',
          vpcCidr: "10.1.0.0/20",
          networking: { enableRedundantNatGateways: true, createVpcEndpoints: true },
          certificate: { transparencyLoggingEnabled: true },
          general: { removalPolicy: 'RETAIN', enableDetailedLogging: true, enableContainerInsights: true },
          kms: { enableKeyRotation: true },
          s3: { enableVersioning: true, lifecycleRules: true }
        },
        'tak-defaults': { project: 'TAK', component: 'BaseInfra', region: 'ap-southeast-2' }
      }
    });
    
    const envConfig = app.node.tryGetContext('prod');
    
    // Specify env to enable context lookups
    const stack = new BaseInfraStack(app, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that ACM certificate is created
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    
    // Check certificate properties
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'example.com',
      SubjectAlternativeNames: [
        '*.example.com',
        '*.map.example.com'
      ],
      ValidationMethod: 'DNS'
    });
  });

  it('throws error when zone name is empty string', () => {
    const app1 = new cdk.App();
    
    // Test stack creation with empty zone name
    expect(() => {
      new BaseInfraStack(app1, 'TestStack', {
        environment: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
        envConfig: {
          stackName: 'Test',
          r53ZoneName: '', // Empty zone name
          networking: { enableRedundantNatGateways: true, createVpcEndpoints: true },
          certificate: { transparencyLoggingEnabled: true },
          general: { removalPolicy: 'RETAIN', enableDetailedLogging: true, enableContainerInsights: true },
          kms: { enableKeyRotation: true },
          s3: { enableVersioning: true, lifecycleRules: true }
        }
      });
    }).toThrow('R53 zone name is required for ACM certificate creation');

    expect(() => {
      new BaseInfraStack(app1, 'TestStack2', {
        environment: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
        envConfig: {
          stackName: 'Test',
          r53ZoneName: '   ', // Whitespace zone name
          networking: { enableRedundantNatGateways: true, createVpcEndpoints: true },
          certificate: { transparencyLoggingEnabled: true },
          general: { removalPolicy: 'RETAIN', enableDetailedLogging: true, enableContainerInsights: true },
          kms: { enableKeyRotation: true },
          s3: { enableVersioning: true, lifecycleRules: true }
        }
      });
    }).toThrow('R53 zone name is required for ACM certificate creation');
    
    // Test direct function call with empty zone name
    const { createAcmCertificate } = require('../lib/constructs/acm');
    const app = new cdk.App();
    const testStack = new cdk.Stack(app, 'ErrorTestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    expect(() => {
      createAcmCertificate(testStack, { zoneName: '' });
    }).toThrow('R53 zone name is required for ACM certificate creation');
    
    expect(() => {
      createAcmCertificate(testStack, { zoneName: undefined as any });
    }).toThrow('R53 zone name is required for ACM certificate creation');
  });

  it('throws error when R53 zone name is not provided', () => {
    // Test that stack creation throws error when undefined zone name is provided
    const app2 = new cdk.App();
    expect(() => {
      new BaseInfraStack(app2, 'TestStack', {
        environment: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
        envConfig: {
          stackName: 'Test',
          r53ZoneName: undefined as any, // Undefined zone name
          networking: { enableRedundantNatGateways: true, createVpcEndpoints: true },
          certificate: { transparencyLoggingEnabled: true },
          general: { removalPolicy: 'RETAIN', enableDetailedLogging: true, enableContainerInsights: true },
          kms: { enableKeyRotation: true },
          s3: { enableVersioning: true, lifecycleRules: true }
        }
      });
    }).toThrow('R53 zone name is required for ACM certificate creation');
  });

  it('creates certificate ARN output when certificate is created', () => {
    const app3 = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        },
        'prod': {
          stackName: 'Prod',
          r53ZoneName: 'example.com',
          vpcCidr: "10.1.0.0/20",
          networking: { enableRedundantNatGateways: true, createVpcEndpoints: true },
          certificate: { transparencyLoggingEnabled: true },
          general: { removalPolicy: 'RETAIN', enableDetailedLogging: true, enableContainerInsights: true },
          kms: { enableKeyRotation: true },
          s3: { enableVersioning: true, lifecycleRules: true }
        },
        'tak-defaults': { project: 'TAK', component: 'BaseInfra', region: 'ap-southeast-2' }
      }
    });
    
    const envConfig = app3.node.tryGetContext('prod');
    
    const stack = new BaseInfraStack(app3, 'TestStack', { 
      environment: 'prod',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate ARN output exists
    const outputs = template.toJSON().Outputs;
    expect(outputs['CertificateArnOutput']).toBeDefined();
    expect(outputs['CertificateArnOutput'].Description).toBe('ACM Certificate ARN');
  });

  it('configures certificate transparency based on environment type', () => {
    const app4 = new cdk.App({
      context: {
        // Mock the hosted zone lookup
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        },
        'dev-test': {
          stackName: 'Dev',
          r53ZoneName: 'example.com',
          vpcCidr: "10.0.0.0/20",
          networking: { enableRedundantNatGateways: false, createVpcEndpoints: false },
          certificate: { transparencyLoggingEnabled: false },
          general: { removalPolicy: 'DESTROY', enableDetailedLogging: true, enableContainerInsights: false },
          kms: { enableKeyRotation: false },
          s3: { enableVersioning: false, lifecycleRules: true }
        },
        'tak-defaults': { project: 'TAK', component: 'BaseInfra', region: 'ap-southeast-2' }
      }
    });
    
    const envConfig = app4.node.tryGetContext('dev-test');
    
    const stack = new BaseInfraStack(app4, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate transparency is disabled for dev-test
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      CertificateTransparencyLoggingPreference: 'DISABLED'
    });
  });

  it('allows certificate transparency override via context', () => {
    const app5 = new cdk.App({
      context: {
        // Mock the hosted zone lookup
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        },
        'tak-defaults': { project: 'TAK', component: 'BaseInfra', region: 'ap-southeast-2' }
      }
    });
    
    // Create custom envConfig with override (normally dev-test has transparency disabled)
    const envConfig = {
      stackName: 'Dev',
      r53ZoneName: 'example.com',
      vpcCidr: "10.0.0.0/20",
      networking: { enableRedundantNatGateways: false, createVpcEndpoints: false },
      certificate: { transparencyLoggingEnabled: true }, // Override dev-test default
      general: { removalPolicy: 'DESTROY', enableDetailedLogging: true, enableContainerInsights: false },
      kms: { enableKeyRotation: false },
      s3: { enableVersioning: false, lifecycleRules: true }
    };
    
    const stack = new BaseInfraStack(app5, 'TestStack', { 
      environment: 'dev-test',
      envConfig: envConfig,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate transparency is enabled despite dev-test environment
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      CertificateTransparencyLoggingPreference: 'ENABLED'
    });
  });

  it('uses default transparency logging when not specified', () => {
    const { createAcmCertificate } = require('../lib/constructs/acm');
    const app = new cdk.App({
      context: {
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    const testStack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    // Test with undefined certificateTransparency
    createAcmCertificate(testStack, { 
      zoneName: 'example.com',
      certificateTransparency: undefined 
    });
    
    const template = Template.fromStack(testStack);
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      CertificateTransparencyLoggingPreference: 'ENABLED'
    });
  });
});