import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { RemovalPolicy } from 'aws-cdk-lib';
import { PolicyStatement, Effect, AccountRootPrincipal } from 'aws-cdk-lib/aws-iam';

export function createEcsResources(scope: Construct, stackName: string, vpc: ec2.IVpc) {
  const ecsCluster = new ecs.Cluster(scope, 'ECSCluster', {
    clusterName: stackName,
    vpc,
  });
  ecsCluster.enableFargateCapacityProviders();
  return { ecsCluster };
}



export function createKmsResources(scope: Construct, stackName: string, enableKeyRotation: boolean, removalPolicy: string) {
  const kmsKey = new kms.Key(scope, 'KMS', {
    description: stackName,
    enableKeyRotation,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  });

  kmsKey.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [new AccountRootPrincipal()],
    actions: ['kms:*'],
    resources: ['*'],
  }));

  const kmsAlias = new kms.Alias(scope, 'KMSAlias', {
    aliasName: `alias/${stackName}`,
    targetKey: kmsKey,
  });

  return { kmsKey, kmsAlias };
}

export function createS3Resources(scope: Construct, stackName: string, region: string, kmsKey: kms.Key, enableVersioning: boolean, removalPolicy: string) {
  const configBucket = new s3.Bucket(scope, 'ConfigBucket', {
    bucketName: `${stackName.toLowerCase()}-${region}-env-config`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    bucketKeyEnabled: true,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: enableVersioning,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
  });
  return { configBucket };
}