import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  vpc: ec2.Vpc;
  ipv6CidrBlock?: ec2.CfnVPCCidrBlock;
  vpcLogicalId?: string;
  ecsCluster: ecs.Cluster;
  ecrRepo: ecr.Repository;
  kmsKey: kms.Key;
  kmsAlias: kms.Alias;
  configBucket: s3.Bucket;
  envConfigBucket: s3.Bucket;
  appImagesBucket: s3.Bucket;
  albLogsBucket: s3.Bucket;
  elbLogsBucket: s3.Bucket;
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
    { key: 'EcrRepoArn', value: params.ecrRepo.repositoryArn, description: 'ECR Repository ARN' },
    { key: 'KmsKeyArn', value: params.kmsKey.keyArn, description: 'KMS Key ARN' },
    { key: 'KmsAlias', value: params.kmsAlias.aliasName, description: 'KMS Key Alias' },
    { key: 'S3BucketArn', value: params.configBucket.bucketArn, description: 'S3 Configuration Bucket ARN' },
    { key: 'S3TAKImagesArn', value: params.appImagesBucket.bucketArn, description: 'S3 TAK Images Bucket ARN' },
    { key: 'S3EnvConfigArn', value: params.envConfigBucket.bucketArn, description: 'S3 Environment Config Bucket ARN' },
    { key: 'S3ElbLogsArn', value: params.elbLogsBucket.bucketArn, description: 'S3 ELB Access Logs Bucket ARN' },
    { key: 'S3AlbLogsArn', value: params.albLogsBucket.bucketArn, description: 'S3 ALB Access Logs Bucket ARN (deprecated - use S3ElbLogsArn)' },

  ];

  outputs.forEach(({ key, value, description }) => {
    new cdk.CfnOutput(stack, `${key}Output`, {
      value,
      description,
      exportName: `${stackName}-${key}`,
    });
  });

  // Legacy ConfigBucket export (for migration)
  new cdk.CfnOutput(stack, 'ConfigBucketOutput', {
    value: params.configBucket.bucketName,
    description: 'Legacy configuration bucket (deprecated)',
    exportName: `${stackName}-ConfigBucket`,
  });

  // New EnvConfigBucket export
  new cdk.CfnOutput(stack, 'EnvConfigBucketOutput', {
    value: params.envConfigBucket.bucketName,
    description: 'Environment configuration bucket with globally unique naming',
    exportName: `${stackName}-EnvConfigBucket`,
  });

  // AppImagesBucket export (updated with new naming)
  new cdk.CfnOutput(stack, 'AppImagesBucketOutput', {
    value: params.appImagesBucket.bucketName,
    description: 'Application images bucket with globally unique naming',
    exportName: `${stackName}-AppImagesBucket`,
  });

  // ElbLogsBucket export
  new cdk.CfnOutput(stack, 'ElbLogsBucketOutput', {
    value: params.elbLogsBucket.bucketName,
    description: 'ELB access logs bucket with globally unique naming (ALB and NLB)',
    exportName: `${stackName}-ElbLogsBucket`,
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
