import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy, StackProps, Fn, CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

// Construct imports
import { createVpcL2Resources } from './constructs/vpc';
import { createEcsResources } from './constructs/ecs';
import { createEcrResources } from './constructs/ecr';
import { createKmsResources } from './constructs/kms';
import { createS3Resources } from './constructs/s3';
import { createVpcEndpoints } from './constructs/endpoints';
import { createAcmCertificate } from './constructs/acm';

// Utility imports
import { registerOutputs } from './outputs';
import { createStackConfigFromContext, BaseInfraConfigResult, ContextEnvironmentConfig } from './stack-config';

export interface BaseInfraStackProps extends StackProps {
  environment: 'prod' | 'dev-test';
  envConfig: ContextEnvironmentConfig; // Environment configuration from context
}

/**
 * Main CDK stack for the TAK Base Infrastructure
 */
export class BaseInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BaseInfraStackProps) {
    super(scope, id, {
      ...props,
      description: 'TAK Base Layer - VPC, ECS, ECR, KMS, S3, ACM',
    });

    // Create configuration from context
    const configResult: BaseInfraConfigResult = createStackConfigFromContext(props.environment, props.envConfig);

    // Apply tags
    const defaults = this.node.tryGetContext('tak-defaults');
    cdk.Tags.of(this).add('Project', defaults?.project || 'TAK');
    cdk.Tags.of(this).add('Environment', props.envConfig.stackName);
    cdk.Tags.of(this).add('Component', defaults?.component || 'BaseInfra');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Extract configuration values
    const { 
      stackConfig, 
      isHighAvailability, 
      environmentLabel,
      createNatGateways,
      enableVpcEndpoints,
      certificateTransparency 
    } = configResult;
    const vpcCidr = stackConfig.overrides?.networking?.vpcCidr ?? props.envConfig.vpcCidr ?? '10.0.0.0/20';
    const r53ZoneName = stackConfig.r53ZoneName;

    // Add Environment Type tag
    cdk.Tags.of(this).add('Environment Type', environmentLabel);

    // Create AWS resources
    const { vpc, ipv6CidrBlock, vpcLogicalId } = createVpcL2Resources(this, vpcCidr, createNatGateways);
    const { ecsCluster } = createEcsResources(this, this.stackName, vpc);
    const { ecrRepo } = createEcrResources(this, this.stackName);
    const { kmsKey, kmsAlias } = createKmsResources(this, this.stackName);
    const { configBucket } = createS3Resources(this, this.stackName, cdk.Stack.of(this).region, kmsKey);

    // Endpoint Security Group (for interface endpoints)
    let endpointSg: ec2.SecurityGroup | undefined = undefined;
    if (enableVpcEndpoints) {
      endpointSg = new ec2.SecurityGroup(this, 'EndpointSecurityGroup', {
        vpc,
        description: 'Access to Endpoint services',
        allowAllOutbound: true,
      });
      endpointSg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(443));
    }

    // VPC Endpoints
    const vpcEndpoints = createVpcEndpoints(this, {
      vpc,
      endpointSg,
      createVpcEndpoints: enableVpcEndpoints,
    });

    // ACM Certificate
    let certificate: acm.Certificate | undefined = undefined;
    let hostedZone: route53.IHostedZone | undefined = undefined;
    
    // Always create certificate with R53 zone 
    const acmResources = createAcmCertificate(this, { 
      zoneName: r53ZoneName,
      certificateTransparency: certificateTransparency,
    });
    certificate = acmResources.certificate;
    hostedZone = acmResources.hostedZone;

    // Outputs
    registerOutputs({
      stack: this,
      stackName: this.stackName,
      vpc,
      ipv6CidrBlock,
      vpcLogicalId,
      ecsCluster,
      ecrRepo,
      kmsKey,
      kmsAlias,
      configBucket,
      vpcEndpoints,
      certificate,
      hostedZone,
    });
  }
}
