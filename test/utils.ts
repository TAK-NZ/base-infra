// Utility functions for CDK tests
import * as cdk from 'aws-cdk-lib';

// CloudFormation template interfaces
export interface CloudFormationResource {
  Type: string;
  Properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CloudFormationOutput {
  Value: unknown;
  Description?: string;
  Export?: { Name: string };
  [key: string]: unknown;
}

export interface CloudFormationTemplate {
  Resources?: Record<string, CloudFormationResource>;
  Outputs?: Record<string, CloudFormationOutput>;
  Parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

export function getResourceByType(template: CloudFormationTemplate, type: string): CloudFormationResource[] {
  return Object.values(template.Resources || {}).filter((r: CloudFormationResource) => r.Type === type);
}

export function getOutputByName(template: CloudFormationTemplate, name: string): CloudFormationOutput | undefined {
  return template.Outputs?.[name];
}

/**
 * Creates a CDK App with context values needed for testing
 */
export function createTestApp(): cdk.App {
  const app = new cdk.App({
    context: {
      'dev-test': {
        stackName: 'Dev',
        r53ZoneName: 'dev.tak.nz',
        vpcCidr: '10.0.0.0/20',
        networking: {
          createNatGateways: false,
          createVpcEndpoints: false
        },
        certificate: {
          transparencyLoggingEnabled: false
        },
        general: {
          removalPolicy: 'DESTROY',
          enableDetailedLogging: true,
          enableContainerInsights: false
        },
        kms: {
          enableKeyRotation: false
        },
        s3: {
          enableVersioning: false,
          lifecycleRules: true
        },
        ecr: {
          imageRetentionCount: 5,
          scanOnPush: false
        }
      },
      'prod': {
        stackName: 'Prod',
        r53ZoneName: 'tak.nz',
        vpcCidr: '10.1.0.0/20',
        networking: {
          createNatGateways: true,
          createVpcEndpoints: true
        },
        certificate: {
          transparencyLoggingEnabled: true
        },
        general: {
          removalPolicy: 'RETAIN',
          enableDetailedLogging: true,
          enableContainerInsights: true
        },
        kms: {
          enableKeyRotation: true
        },
        s3: {
          enableVersioning: true,
          lifecycleRules: true
        },
        ecr: {
          imageRetentionCount: 20,
          scanOnPush: true
        }
      },
      'tak-defaults': {
        project: 'TAK',
        component: 'BaseInfra',
        region: 'ap-southeast-2'
      }
    }
  });
  return app;
}
