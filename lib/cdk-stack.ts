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

export interface BaseInfraStackProps extends StackProps {
  envType?: 'prod' | 'dev-test';
  vpcLocationId?: number;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BaseInfraStackProps) {
    super(scope, id, props);

    // Resolve parameters using cascading resolution
    const { envType, vpcLocationId, resolver } = resolveStackParameters(this);
    
    console.log(`🚀 Deploying stack with envType: ${envType}, vpcLocationId: ${vpcLocationId}`);

    // Create CDK Parameters (for CloudFormation template compatibility)
    const vpcLocationIdParam = resolver.createCfnParameter(this, 'vpcLocationId', 'VPCLocationId', {
      type: 'Number',
      description: 'Unique VPC ID per AWS region (0-4095, used for /20 CIDR blocks)',
      default: vpcLocationId,
      minValue: 0,
      maxValue: 4095,
    });

    const envTypeParam = resolver.createCfnParameter(this, 'envType', 'EnvType', {
      type: 'String',
      description: 'Environment type',
      allowedValues: ['prod', 'dev-test'],
      default: envType,
    });

    // Condition for prod resources
    const createProdResources = new CfnCondition(this, 'CreateProdResources', {
      expression: Fn.conditionEquals(envTypeParam.valueAsString, 'prod'),
    });

    const stackName = Fn.ref('AWS::StackName');
    const region = cdk.Stack.of(this).region;

    // VPC and networking resources
    const vpcResources = createVpcResources(this, envTypeParam.valueAsString, vpcLocationIdParam.valueAsNumber, createProdResources);

    // ECS
    const { ecsCluster } = createEcsResources(this, stackName);

    // ECR
    const { ecrRepo } = createEcrResources(this, stackName);

    // KMS
    const { kmsKey, kmsAlias } = createKmsResources(this, stackName);

    // S3
    const { configBucket } = createS3Resources(this, stackName, region, kmsAlias.ref);

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
      vpcResources,
      ecsCluster,
      ecrRepo,
      kmsKey,
      configBucket,
    });
  }
}
