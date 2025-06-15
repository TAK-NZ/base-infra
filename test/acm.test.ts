import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createStackConfig } from '../lib/stack-config';

describe('ACM Certificate', () => {
  it('creates ACM certificate with correct domain names when R53 zone is provided', () => {
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
    
    // Specify env to enable context lookups
    const stack = new BaseInfraStack(app, 'TestStack', { 
      stackConfig: config,
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
    // Test config creation with empty zone name
    expect(() => {
      createStackConfig('prod', '');
    }).toThrow('r53ZoneName is required and cannot be empty');

    expect(() => {
      createStackConfig('prod', '   ');
    }).toThrow('r53ZoneName is required and cannot be empty');
    
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
    // Test that config creation throws error when no R53 zone name is provided
    expect(() => {
      createStackConfig('prod', undefined as any);
    }).toThrow('r53ZoneName is required and cannot be empty');
  });

  it('creates certificate ARN output when certificate is created', () => {
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
      stackConfig: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate ARN output exists
    const outputs = template.toJSON().Outputs;
    expect(outputs['CertificateArnOutput']).toBeDefined();
    expect(outputs['CertificateArnOutput'].Description).toBe('ACM Certificate ARN for public hosted zone');
  });

  it('configures certificate transparency based on environment type', () => {
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    const config = createStackConfig('dev-test', 'example.com');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      stackConfig: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate transparency is disabled for dev-test
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      CertificateTransparencyLoggingPreference: 'DISABLED'
    });
  });

  it('allows certificate transparency override via context', () => {
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    const config = createStackConfig('dev-test', 'example.com', {
      certificate: { transparencyLoggingEnabled: true } // Override dev-test default
    });
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      stackConfig: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate transparency is enabled despite dev-test environment
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      CertificateTransparencyLoggingPreference: 'ENABLED'
    });
  });
});
