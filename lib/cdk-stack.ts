import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createVpcL2Resources } from './vpc-resources';
import { createEcsResources } from './ecs-resources';
import { createEcrResources } from './ecr-resources';
import { createKmsResources } from './kms-resources';
import { createS3Resources } from './s3-resources';
import { createVpcEndpoints } from './vpc-endpoints';
import { RemovalPolicy, StackProps, Fn, CfnOutput } from 'aws-cdk-lib';
import { registerOutputs } from './outputs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';


export interface BaseInfraStackProps extends StackProps {
  envType?: 'prod' | 'dev-test';
  vpcMajorId?: number;
  vpcMinorId?: number;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BaseInfraStackProps) {
    super(scope, id, {
      ...props,
      description: 'TAK Base Layer - VPC, ECS, ECR, KMS, S3',
    });

    const envType = props.envType || 'dev-test';
    const vpcMajorId = props.vpcMajorId || 0;
    const vpcMinorId = props.vpcMinorId || 0;
    const resolvedStackName = id;
    
    // Create CDK Parameters (for CloudFormation template compatibility)
    // Removed parameterization logic, using direct values or context

    // Condition for prod resources
    const createProdResources = envType === 'prod';

    const stackName = Fn.ref('AWS::StackName');
    const region = cdk.Stack.of(this).region;

    // Create L2 VPC and subnets directly
    const vpc = createVpcL2Resources(this, vpcMajorId, vpcMinorId);

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
    if (envType === 'prod') {
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
      privateSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds,
      endpointSg,
      stackName,
      isProd: envType === 'prod',
    });

    // Outputs
    registerOutputs({
      stack: this,
      stackName,
      vpc,
      ecsCluster,
      ecrRepo,
      kmsKey,
      kmsAlias,
      configBucket,
      vpcEndpoints,
    });
  }
}
