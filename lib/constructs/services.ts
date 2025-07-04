import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { PolicyStatement, Effect, AccountRootPrincipal } from 'aws-cdk-lib/aws-iam';

export function createEcsResources(scope: Construct, stackName: string, vpc: ec2.IVpc) {
  const ecsCluster = new ecs.Cluster(scope, 'ECSCluster', {
    clusterName: stackName,
    vpc,
  });
  ecsCluster.enableFargateCapacityProviders();
  return { ecsCluster };
}

export function createEcrResources(scope: Construct, stackName: string, imageRetentionCount: number, scanOnPush: boolean, removalPolicy: string) {
  const ecrRepo = new ecr.Repository(scope, 'ECRRepo', {
    repositoryName: stackName.toLowerCase(),
    imageScanOnPush: scanOnPush,
    imageTagMutability: ecr.TagMutability.MUTABLE,
    lifecycleRules: [{
      maxImageCount: imageRetentionCount,
    }, {
      tagStatus: ecr.TagStatus.UNTAGGED,
      maxImageAge: cdk.Duration.days(1),
    }],
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  });
  return { ecrRepo };
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

  const appImagesBucket = new s3.Bucket(scope, 'AppImagesBucket', {
    bucketName: `${stackName.toLowerCase()}-${region}-app-images`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    bucketKeyEnabled: true,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: enableVersioning,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
  });

  return { configBucket, appImagesBucket };
}