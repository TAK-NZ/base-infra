import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

// Construct imports
import { createVpcL2Resources } from './constructs/vpc';
import { createEcsResources, createEcrResources, createKmsResources, createS3Resources } from './constructs/services';
import { createVpcEndpoints } from './constructs/endpoints';
import { createAcmCertificate } from './constructs/acm';

// Utility imports
import { registerOutputs } from './outputs';
import { ContextEnvironmentConfig } from './stack-config';
import { DEFAULT_VPC_CIDR } from './utils/constants';

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

    // Use environment configuration directly (no complex transformations needed)
    const { envConfig } = props;
    
    // Extract configuration values directly from envConfig
    const vpcCidr = envConfig.vpcCidr ?? DEFAULT_VPC_CIDR;
    const r53ZoneName = envConfig.r53ZoneName;
    const enableRedundantNatGateways = envConfig.networking.enableRedundantNatGateways;
    const enableVpcEndpoints = envConfig.networking.createVpcEndpoints;
    const certificateTransparency = envConfig.certificate.transparencyLoggingEnabled;
    const removalPolicy = envConfig.general.removalPolicy;
    const enableKeyRotation = envConfig.kms.enableKeyRotation;
    const enableVersioning = envConfig.s3.enableVersioning;
    const imageRetentionCount = envConfig.ecr.imageRetentionCount;
    const scanOnPush = envConfig.ecr.scanOnPush;

    // Create AWS resources
    const { vpc, ipv6CidrBlock, vpcLogicalId } = createVpcL2Resources(this, vpcCidr, enableRedundantNatGateways);
    const { ecsCluster } = createEcsResources(this, this.stackName, vpc);
    const { ecrRepo } = createEcrResources(this, this.stackName, imageRetentionCount, scanOnPush, removalPolicy);
    const { kmsKey, kmsAlias } = createKmsResources(this, this.stackName, enableKeyRotation, removalPolicy);
    const { configBucket, envConfigBucket, appImagesBucket, albLogsBucket, elbLogsBucket } = createS3Resources(this, this.stackName, cdk.Stack.of(this).region, kmsKey, enableVersioning, removalPolicy, envConfig.s3.elbLogsRetentionDays);

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
      envConfigBucket,
      appImagesBucket,
      albLogsBucket,
      elbLogsBucket,
      vpcEndpoints,
      certificate,
      hostedZone,
    });
  }
}
