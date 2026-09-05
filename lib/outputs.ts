import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  vpc: ec2.Vpc;
  ipv6CidrBlock?: ec2.CfnVPCCidrBlock;
  vpcLogicalId?: string;
  ecsCluster: ecs.Cluster;

  ecrArtifactsRepo: ecr.Repository;
  ecrEtlTasksRepo: ecr.Repository;
  kmsKey: kms.Key;
  kmsAlias: kms.Alias;
  envConfigBucket: s3.Bucket;
  appImagesBucket: s3.Bucket;
  elbLogsBucket: s3.Bucket;
  mapDownloadsBucket: s3.Bucket;
  mapBuildInstanceProfile: iam.InstanceProfile;
  mapBuildNotificationsTopic: sns.Topic;
  mapBuildSchedulerRole: iam.Role;
  vpcEndpoints?: Record<string, ec2.GatewayVpcEndpoint | ec2.InterfaceVpcEndpoint>;
  certificate?: acm.Certificate;
  hostedZone?: route53.IHostedZone;
}

/**
 * Registers all CloudFormation outputs for the base infrastructure stack
 */
export function registerOutputs(params: OutputParams): void {
  const { stack, stackName } = params;
  
  // Standard outputs
  const outputs = [
    { key: 'VpcId', value: params.vpc.vpcId, description: 'VPC ID' },
    { key: 'VpcCidrIpv4', value: params.vpc.vpcCidrBlock, description: 'VPC IPv4 CIDR Block' },
    { key: 'SubnetPublicA', value: params.vpc.publicSubnets[0].subnetId, description: 'Subnet Public A' },
    { key: 'SubnetPublicB', value: params.vpc.publicSubnets[1].subnetId, description: 'Subnet Public B' },
    { key: 'SubnetPrivateA', value: params.vpc.privateSubnets[0].subnetId, description: 'Subnet Private A' },
    { key: 'SubnetPrivateB', value: params.vpc.privateSubnets[1].subnetId, description: 'Subnet Private B' },
    { key: 'EcsClusterArn', value: params.ecsCluster.clusterArn, description: 'ECS Cluster ARN' },

    { key: 'EcrArtifactsRepoArn', value: params.ecrArtifactsRepo.repositoryArn, description: 'ECR Artifacts Repository ARN' },
    { key: 'EcrEtlTasksRepoArn', value: params.ecrEtlTasksRepo.repositoryArn, description: 'ECR ETL Tasks Repository ARN' },
    { key: 'KmsKeyArn', value: params.kmsKey.keyArn, description: 'KMS Key ARN' },
    { key: 'KmsAlias', value: params.kmsAlias.aliasName, description: 'KMS Key Alias' },
    { key: 'S3TAKImagesArn', value: params.appImagesBucket.bucketArn, description: 'S3 TAK Images Bucket ARN' },
    { key: 'S3EnvConfigArn', value: params.envConfigBucket.bucketArn, description: 'S3 Environment Config Bucket ARN' },
    { key: 'S3ElbLogsArn', value: params.elbLogsBucket.bucketArn, description: 'S3 ELB Access Logs Bucket ARN' },

  ];

  outputs.forEach(({ key, value, description }) => {
    new cdk.CfnOutput(stack, `${key}Output`, {
      value,
      description,
      exportName: `${stackName}-${key}`,
    });
  });

  // EnvConfigBucket export
  new cdk.CfnOutput(stack, 'EnvConfigBucketOutput', {
    value: params.envConfigBucket.bucketName,
    description: 'Environment configuration bucket with globally unique naming',
    exportName: `${stackName}-EnvConfigBucket`,
  });

  // AppImagesBucket export
  new cdk.CfnOutput(stack, 'AppImagesBucketOutput', {
    value: params.appImagesBucket.bucketName,
    description: 'Application images bucket with globally unique naming',
    exportName: `${stackName}-AppImagesBucket`,
  });

  // EcsClusterName export -- plain name, for CLI use (e.g. `aws ecs
  // update-service --cluster <name>`), alongside the existing EcsClusterArn
  new cdk.CfnOutput(stack, 'EcsClusterNameOutput', {
    value: params.ecsCluster.clusterName,
    description: 'ECS Cluster name',
    exportName: `${stackName}-EcsClusterName`,
  });

  // ElbLogsBucket export
  new cdk.CfnOutput(stack, 'ElbLogsBucketOutput', {
    value: params.elbLogsBucket.bucketName,
    description: 'ELB access logs bucket with globally unique naming (ALB and NLB)',
    exportName: `${stackName}-ElbLogsBucket`,
  });

  // MapDownloadsBucket export -- large user-downloadable offline map files
  new cdk.CfnOutput(stack, 'MapDownloadsBucketOutput', {
    value: params.mapDownloadsBucket.bucketName,
    description: 'Offline map downloads bucket with globally unique naming',
    exportName: `${stackName}-MapDownloadsBucket`,
  });

  // MapBuildInstanceProfile export -- for the manually-launched EC2 build script
  new cdk.CfnOutput(stack, 'MapBuildInstanceProfileOutput', {
    value: params.mapBuildInstanceProfile.instanceProfileArn,
    description: 'Instance profile ARN for the offline map build EC2 instance',
    exportName: `${stackName}-MapBuildInstanceProfileArn`,
  });
  new cdk.CfnOutput(stack, 'MapBuildInstanceProfileNameOutput', {
    value: params.mapBuildInstanceProfile.instanceProfileName,
    description: 'Instance profile name for the offline map build EC2 instance',
    exportName: `${stackName}-MapBuildInstanceProfileName`,
  });

  // MapBuildNotificationsTopic export
  new cdk.CfnOutput(stack, 'MapBuildNotificationsTopicOutput', {
    value: params.mapBuildNotificationsTopic.topicArn,
    description: 'SNS topic ARN for offline map build progress/completion notifications',
    exportName: `${stackName}-MapBuildNotificationsTopicArn`,
  });

  // MapBuildSchedulerRole export -- used by launch-build-instance.sh to
  // create the per-launch stale-instance safety-net schedule
  new cdk.CfnOutput(stack, 'MapBuildSchedulerRoleOutput', {
    value: params.mapBuildSchedulerRole.roleArn,
    description: 'EventBridge Scheduler execution role ARN for the offline map build stale-instance safety net',
    exportName: `${stackName}-MapBuildSchedulerRoleArn`,
  });

  // Conditional outputs
  if (params.ipv6CidrBlock && params.vpcLogicalId) {
    new cdk.CfnOutput(stack, 'VpcCidrIpv6Output', {
      value: cdk.Fn.select(0, params.vpc.vpcIpv6CidrBlocks),
      description: 'VPC IPv6 CIDR Block',
      exportName: `${stackName}-VpcCidrIpv6`,
    });
  }

  if (params.certificate) {
    new cdk.CfnOutput(stack, 'CertificateArnOutput', {
      value: params.certificate.certificateArn,
      description: 'ACM Certificate ARN',
      exportName: `${stackName}-CertificateArn`,
    });
  }

  if (params.hostedZone) {
    new cdk.CfnOutput(stack, 'HostedZoneIdOutput', {
      value: params.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${stackName}-HostedZoneId`,
    });
    
    new cdk.CfnOutput(stack, 'HostedZoneNameOutput', {
      value: params.hostedZone.zoneName,
      description: 'Route53 Hosted Zone Name',
      exportName: `${stackName}-HostedZoneName`,
    });
  }
}
