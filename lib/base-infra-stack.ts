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
import { BaseInfraConfigResult } from './stack-config';

export interface BaseInfraStackProps extends StackProps {
  configResult: BaseInfraConfigResult;
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

    // Destructure the complete configuration result
    const { 
      stackConfig, 
      environmentConfig, 
      isHighAvailability,
      environmentLabel,
      createNatGateways,
      enableVpcEndpoints,
      certificateTransparency 
    } = props.configResult;
    
    // Extract basic configuration values
    const envType = stackConfig.envType;
    const vpcMajorId = stackConfig.overrides?.networking?.vpcMajorId ?? 0;
    const vpcMinorId = stackConfig.overrides?.networking?.vpcMinorId ?? 0;
    const resolvedStackName = id;
    const r53ZoneName = stackConfig.r53ZoneName;

    // Add Environment Type tag to the stack
    cdk.Tags.of(this).add('Environment Type', environmentLabel);

    const stackName = Fn.ref('AWS::StackName');
    const region = cdk.Stack.of(this).region;

    // Create L2 VPC and subnets directly
    const { vpc, ipv6CidrBlock, vpcLogicalId } = createVpcL2Resources(this, vpcMajorId, vpcMinorId, createNatGateways);

    // ECS
    const { ecsCluster } = createEcsResources(this, this.stackName, vpc);

    // ECR
    const { ecrRepo } = createEcrResources(this, this.stackName);

    // KMS
    const { kmsKey, kmsAlias } = createKmsResources(this, this.stackName);

    // S3
    const { configBucket } = createS3Resources(this, this.stackName, region, kmsKey);

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
      stackName,
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
