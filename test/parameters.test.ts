import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { resolveStackParameters } from '../lib/parameters';

describe('Parameters', () => {
  describe('resolveStackParameters', () => {
    it('throws error when R53 zone name is not provided', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

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
      expect(params.envType).toBe('prod');
      expect(params.vpcMajorId).toBe(0);
      expect(params.vpcMinorId).toBe(0);
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
        new BaseInfraStack(app, 'TestStack', { envType: 'prod' });
      }).toThrow('R53 zone name is required. Please provide it via R53_ZONE_NAME environment variable or --context r53ZoneName=your-domain.com');
    });
  });
});
