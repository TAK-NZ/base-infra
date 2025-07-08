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

export function createS3Resources(scope: Construct, stackName: string, region: string, kmsKey: kms.Key, enableVersioning: boolean, removalPolicy: string, albLogsRetentionDays: number) {
  // Legacy config bucket - keep for migration
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

  // New config bucket with globally unique naming
  const envConfigBucket = new s3.Bucket(scope, 'EnvConfigBucket', {
    bucketName: `tak-${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-config`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    bucketKeyEnabled: true,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: enableVersioning,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
  });

  // Updated app images bucket with globally unique naming
  const appImagesBucket = new s3.Bucket(scope, 'AppImagesBucket', {
    bucketName: `tak-${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-artifacts`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    bucketKeyEnabled: true,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: enableVersioning,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
  });

  // ALB access logs bucket with globally unique naming
  const albLogsBucket = new s3.Bucket(scope, 'AlbLogsBucket', {
    bucketName: `tak-${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-logs`,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: removalPolicy !== 'RETAIN',
    lifecycleRules: [{
      id: 'MonthlyDelete',
      expiration: cdk.Duration.days(albLogsRetentionDays),
      enabled: true
    }]
  });

  // Grant ALB service account permission to write access logs
  const elbServiceAccountMap: { [key: string]: string } = {
    'us-east-1': '127311923021', 'us-east-2': '033677994240', 'us-west-1': '027434742980', 'us-west-2': '797873946194',
    'ca-central-1': '985666609251', 'eu-central-1': '054676820928', 'eu-west-1': '156460612806', 'eu-west-2': '652711504416',
    'eu-west-3': '009996457667', 'eu-north-1': '897822967062', 'eu-south-1': '635631232127', 'ap-east-1': '754344448648',
    'ap-northeast-1': '582318560864', 'ap-northeast-2': '600734575887', 'ap-northeast-3': '383597477331', 'ap-southeast-1': '114774131450',
    'ap-southeast-2': '783225319266', 'ap-southeast-3': '589379963580', 'ap-south-1': '718504428378', 'me-south-1': '076674570225',
    'sa-east-1': '507241528517', 'af-south-1': '098369216593', 'us-gov-west-1': '048591011584', 'us-gov-east-1': '190560391635'
  };
  
  const elbPrincipal = elbServiceAccountMap[region] 
    ? new cdk.aws_iam.AccountPrincipal(elbServiceAccountMap[region])
    : new cdk.aws_iam.ServicePrincipal('elasticloadbalancing.amazonaws.com');
  
  albLogsBucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [elbPrincipal],
    actions: ['s3:PutObject'],
    resources: [`${albLogsBucket.bucketArn}/*`]
  }));
  
  albLogsBucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [elbPrincipal],
    actions: ['s3:GetBucketAcl'],
    resources: [albLogsBucket.bucketArn]
  }));

  // Allow cross-stack access for other TAK infrastructure layers
  albLogsBucket.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [new AccountRootPrincipal()],
    actions: [
      's3:GetBucketLocation',
      's3:GetBucketAcl',
      's3:ListBucket'
    ],
    resources: [albLogsBucket.bucketArn]
  }));

  return { configBucket, envConfigBucket, appImagesBucket, albLogsBucket };
}