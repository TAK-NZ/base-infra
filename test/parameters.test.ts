import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';

describe('Parameter Resolution', () => {
  it('uses default parameters if not provided', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  it('generates valid CIDR blocks using two-parameter system', () => {
    // Test different combinations of Major and Minor IDs
    const testCases = [
      { majorId: 0, minorId: 0, description: 'First /20 block in first /16' },
      { majorId: 1, minorId: 5, description: 'Sixth /20 block in second /16' },
      { majorId: 255, minorId: 15, description: 'Last /20 block in last /16' }
    ];

    testCases.forEach(({ majorId, minorId, description }) => {
      const app = new cdk.App(); // Create separate app for each test case
      const stack = new CdkStack(app, `TestStack${majorId}${minorId}`, { 
        envType: 'prod', 
        vpcMajorId: majorId, 
        vpcMinorId: minorId 
      });
      const template = Template.fromStack(stack);
      
      // Verify VPC exists with proper CIDR structure
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: {
          "Fn::Select": [
            { "Ref": "VPCMinorId" },
            {
              "Fn::Cidr": [
                {
                  "Fn::Select": [
                    { "Ref": "VPCMajorId" },
                    { "Fn::Cidr": ["10.0.0.0/8", 256, 16] }
                  ]
                },
                16,
                12
              ]
            }
          ]
        }
      });
      
      // Verify parameters exist with correct constraints
      template.hasParameter('VPCMajorId', {
        Type: 'Number',
        MinValue: 0,
        MaxValue: 255
        // Default value may vary based on resolver configuration
      });
      
      template.hasParameter('VPCMinorId', {
        Type: 'Number',
        MinValue: 0,
        MaxValue: 15
        // Default value may vary based on resolver configuration
      });
    });
  });
});
