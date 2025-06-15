import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createVpcL2Resources } from './constructs/vpc';
import { createEcsResources } from './constructs/ecs';
import { createEcrResources } from './constructs/ecr';
import { createKmsResources } from './constructs/kms';
import { createS3Resources } from './constructs/s3';
import { createVpcEndpoints } from './constructs/endpoints';
import { RemovalPolicy, StackProps, Fn, CfnOutput } from 'aws-cdk-lib';
import { registerOutputs } from './outputs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { createAcmCertificate } from './constructs/acm';
import { resolveStackParameters } from './parameters';


export interface BaseInfraStackProps extends StackProps {
  envType?: 'prod' | 'dev-test';
  vpcMajorId?: number;
  vpcMinorId?: number;
}

export class BaseInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BaseInfraStackProps) {
    super(scope, id, {
      ...props,
      description: 'TAK Base Layer - VPC, ECS, ECR, KMS, S3, ACM',
    });

    // Resolve parameters from context, env vars, or defaults
    const params = resolveStackParameters(this);
    
    const envType = (props.envType || params.envType) as 'prod' | 'dev-test';
    const vpcMajorId = props.vpcMajorId ?? params.vpcMajorId;
    const vpcMinorId = props.vpcMinorId ?? params.vpcMinorId;
    const resolvedStackName = id;
    const r53ZoneName = params.r53ZoneName;
    const createNatGateways = params.createNatGateways;
    const enableVpcEndpoints = params.createVpcEndpoints;
    const certificateTransparency = params.certificateTransparency;

    // Add Environment Type tag to the stack
    const environmentLabel = envType === 'prod' ? 'Prod' : 'Dev-Test';
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

    // ACM Certificate (mandatory - auto-create with R53 zone)
    let certificate: any = undefined;
    let hostedZone: any = undefined;
    
    // Always create certificate with R53 zone (now mandatory)
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
