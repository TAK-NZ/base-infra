import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createVpcResources } from './vpc-resources';
import { createEcsResources } from './ecs-resources';
import { createEcrResources } from './ecr-resources';
import { createKmsResources } from './kms-resources';
import { createS3Resources } from './s3-resources';
import { createVpcEndpoints } from './vpc-endpoints';
import { RemovalPolicy, StackProps, Fn, CfnOutput, CfnParameter, CfnCondition } from 'aws-cdk-lib';
import { getParameters, resolveStackParameters } from './parameters';
import { registerOutputs } from './outputs';
import { ParameterResolver } from './parameter-resolver';

export interface BaseInfraStackProps extends StackProps {
  envType?: 'prod' | 'dev-test';
  vpcMajorId?: number;
  vpcMinorId?: number;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BaseInfraStackProps) {
    super(scope, id, props);

    // Use synchronous parameter resolution
    const envType = props?.envType || 'dev-test';
    const vpcMajorId = props?.vpcMajorId || 0;
    const vpcMinorId = props?.vpcMinorId || 0;
    const resolvedStackName = 'devtest'; // Default for now
    
    const resolver = new ParameterResolver();

    // Create CDK Parameters (for CloudFormation template compatibility)
    const vpcMajorIdParam = resolver.createCfnParameter(this, 'vpcMajorId', 'VPCMajorId', {
      type: 'Number',
      description: 'Major VPC ID (0-255) for selecting /16 block from 10.0.0.0/8',
      minValue: 0,
      maxValue: 255,
    }, vpcMajorId);

    const vpcMinorIdParam = resolver.createCfnParameter(this, 'vpcMinorId', 'VPCMinorId', {
      type: 'Number',
      description: 'Minor VPC ID (0-15) for selecting /20 subnet within the /16 block',
      minValue: 0,
      maxValue: 15,
    }, vpcMinorId);

    const envTypeParam = resolver.createCfnParameter(this, 'envType', 'EnvType', {
      type: 'String',
      description: 'Environment type',
      allowedValues: ['prod', 'dev-test'],
    }, envType);

    const stackNameParam = resolver.createCfnParameter(this, 'stackName', 'StackName', {
      type: 'String',
      description: 'Stack deployment identifier for naming resources',
    }, resolvedStackName);

    // Condition for prod resources
    const createProdResources = new CfnCondition(this, 'CreateProdResources', {
      expression: Fn.conditionEquals(envTypeParam.valueAsString, 'prod'),
    });

    const stackName = Fn.ref('AWS::StackName');
    const region = cdk.Stack.of(this).region;

    // VPC and networking resources
    const vpcResources = createVpcResources(this, envType, vpcMajorIdParam, vpcMinorIdParam, createProdResources);

    // ECS
    const { ecsCluster } = createEcsResources(this, this.stackName);

    // ECR
    const { ecrRepo } = createEcrResources(this, this.stackName);

    // KMS
    const { kmsKey, kmsAlias } = createKmsResources(this, this.stackName);

    // S3
    const { configBucket } = createS3Resources(this, this.stackName, region, kmsAlias.ref);

    // VPC Endpoints
    createVpcEndpoints(this, {
      vpcId: vpcResources.vpc.ref,
      region,
      privateRouteTableA: vpcResources.privateRouteTableA.ref,
      privateRouteTableB: vpcResources.privateRouteTableB.ref,
      subnetPrivateA: vpcResources.subnetPrivateA.ref,
      subnetPrivateB: vpcResources.subnetPrivateB.ref,
      endpointSgId: envTypeParam.valueAsString === 'prod' ? 'EndpointSecurityGroup' : undefined,
      stackName,
      isProdCondition: createProdResources,
    });

    // Outputs
    registerOutputs({
      stack: this,
      stackName,
      stackNameParam,
      vpcResources,
      ecsCluster,
      ecrRepo,
      kmsKey,
      configBucket,
    });
  }
}
