import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { resolveStackParameters } from '../lib/parameters';

describe('Parameters', () => {
  describe('resolveStackParameters', () => {
    it('throws error when R53 zone name is not provided', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' }
      });

      expect(() => {
        resolveStackParameters(stack);
      }).toThrow('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');
    });

    it('resolves R53 zone name from context', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com'
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      const params = resolveStackParameters(stack);
      expect(params.r53ZoneName).toBe('example.com');
    });

    it('resolves default values for optional parameters', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com'
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      const params = resolveStackParameters(stack);
      expect(params.envType).toBe('dev-test');
      expect(params.vpcMajorId).toBe(0);
      expect(params.vpcMinorId).toBe(0);
      expect(params.createNatGateways).toBe(false); // dev-test default
      expect(params.createVpcEndpoints).toBe(false); // dev-test default
    });

    it('resolves values from context when provided', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com',
          envType: 'dev-test',
          vpcMajorId: 5,
          vpcMinorId: 10
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      const params = resolveStackParameters(stack);
      expect(params.r53ZoneName).toBe('example.com');
      expect(params.envType).toBe('dev-test');
      expect(params.vpcMajorId).toBe(5);
      expect(params.vpcMinorId).toBe(10);
    });

    it('supports hierarchical parameter system - prod defaults with individual overrides', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com',
          envType: 'prod',
          createNatGateways: false, // Override prod default
          // createVpcEndpoints not specified, should use prod default (true)
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      const params = resolveStackParameters(stack);
      expect(params.envType).toBe('prod');
      expect(params.createNatGateways).toBe(false); // Overridden
      expect(params.createVpcEndpoints).toBe(true);  // Prod default
    });

    it('supports hierarchical parameter system - dev-test defaults with individual overrides', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com',
          envType: 'dev-test',
          createVpcEndpoints: true, // Override dev-test default
          // createNatGateways not specified, should use dev-test default (false)
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      const params = resolveStackParameters(stack);
      expect(params.envType).toBe('dev-test');
      expect(params.createNatGateways).toBe(false); // Dev-test default
      expect(params.createVpcEndpoints).toBe(true); // Overridden
    });

    it('resolves certificate transparency based on environment type', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com'
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      // Test dev-test default (false)
      const devParams = resolveStackParameters(stack);
      expect(devParams.certificateTransparency).toBe(false);

      // Test prod environment (true)
      const prodApp = new cdk.App({
        context: {
          r53ZoneName: 'example.com',
          envType: 'prod'
        }
      });
      const prodStack = new cdk.Stack(prodApp, 'TestStack');
      const prodParams = resolveStackParameters(prodStack);
      expect(prodParams.certificateTransparency).toBe(true);
    });

    it('allows certificate transparency override via context', () => {
      const app = new cdk.App({
        context: {
          r53ZoneName: 'example.com',
          envType: 'dev-test',
          certificateTransparency: true // Override dev-test default
        }
      });
      const stack = new cdk.Stack(app, 'TestStack');

      const params = resolveStackParameters(stack);
      expect(params.certificateTransparency).toBe(true); // Should be overridden
    });
  });

  describe('BaseInfraStack', () => {
    it('creates a VPC with the correct CIDR block', () => {
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

      // For L2 VPC, the CIDR block is always 10.0.0.0/16
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    it('throws error when R53 zone name is not provided', () => {
      const app = new cdk.App();

      expect(() => {
        new BaseInfraStack(app, 'TestStack', { 
          envType: 'prod',
          env: { account: '123456789012', region: 'us-east-1' }
        });
      }).toThrow('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');
    });
  });
});
