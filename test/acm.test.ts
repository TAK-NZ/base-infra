import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('ACM Certificate', () => {
  it('creates ACM certificate with correct domain names when R53 zone is provided', () => {
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
    
    // Specify env to enable context lookups
    const stack = new BaseInfraStack(app, 'TestStack', { 
      envType: 'prod',
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
    const app = new cdk.App();
    
    // Test that the stack throws error when no R53 zone name is provided (now mandatory)
    expect(() => {
      new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
    }).toThrow('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');

    // Test direct function call with empty zone name
    const { createAcmCertificate } = require('../lib/constructs/acm');
    const testStack = new cdk.Stack(app, 'ErrorTestStack');
    
    expect(() => {
      createAcmCertificate(testStack, { zoneName: '' });
    }).toThrow('R53 zone name is required for ACM certificate creation');
    
    expect(() => {
      createAcmCertificate(testStack, { zoneName: undefined as any });
    }).toThrow('R53 zone name is required for ACM certificate creation');
  });

  it('throws error when R53 zone name is not provided', () => {
    const app = new cdk.App();
    
    // Test that stack throws error when no R53 zone name is provided
    expect(() => {
      new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
    }).toThrow('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');
  });

  it('creates certificate ARN output when certificate is created', () => {
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
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      envType: 'prod',
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const template = Template.fromStack(stack);

    // Check that certificate ARN output exists
    const outputs = template.toJSON().Outputs;
    expect(outputs['CertificateArnOutput']).toBeDefined();
    expect(outputs['CertificateArnOutput'].Description).toBe('ACM Certificate ARN for public hosted zone');
  });
});
