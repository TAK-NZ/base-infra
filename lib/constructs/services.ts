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

export function createEcrResources(scope: Construct, stackName: string, imageRetentionCount: number, scanOnPush: boolean, removalPolicy: string, kmsKey: kms.Key) {
  const ecrArtifactsRepo = new ecr.Repository(scope, 'ECRArtifactsRepo', {
    repositoryName: `${stackName.toLowerCase()}-artifacts`,
    imageScanOnPush: scanOnPush,
    imageTagMutability: ecr.TagMutability.MUTABLE,
    encryption: ecr.RepositoryEncryption.KMS,
    encryptionKey: kmsKey,
    lifecycleRules: [
      { tagPrefixList: ['tak-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['authentik-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['ldap-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['pmtiles-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['events-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['data-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['cloudtak-'], maxImageCount: imageRetentionCount },
      { tagStatus: ecr.TagStatus.UNTAGGED, maxImageAge: cdk.Duration.days(1) }
    ],
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  });

  ecrArtifactsRepo.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
    effect: cdk.aws_iam.Effect.ALLOW,
    principals: [new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com')],
    actions: [
      'ecr:BatchCheckLayerAvailability',
      'ecr:GetDownloadUrlForLayer',
      'ecr:BatchGetImage'
    ]
  }));

  const ecrEtlTasksRepo = new ecr.Repository(scope, 'ECREtlTasksRepo', {
    repositoryName: `${stackName.toLowerCase()}-etltasks`,
    imageScanOnPush: scanOnPush,
    imageTagMutability: ecr.TagMutability.MUTABLE,
    encryption: ecr.RepositoryEncryption.KMS,
    encryptionKey: kmsKey,
    lifecycleRules: [
      { tagPrefixList: ['etl-'], maxImageCount: imageRetentionCount },
      { tagStatus: ecr.TagStatus.UNTAGGED, maxImageAge: cdk.Duration.days(1) }
    ],
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  });

  ecrEtlTasksRepo.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
    effect: cdk.aws_iam.Effect.ALLOW,
    principals: [new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com')],
    actions: [
      'ecr:BatchCheckLayerAvailability',
      'ecr:GetDownloadUrlForLayer',
      'ecr:BatchGetImage'
    ]
  }));

  return { ecrArtifactsRepo, ecrEtlTasksRepo };
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

export function createS3Resources(scope: Construct, stackName: string, region: string, kmsKey: kms.Key, enableVersioning: boolean, removalPolicy: string, elbLogsRetentionDays: number) {
  // Config bucket with globally unique naming
  const envConfigBucket = new s3.Bucket(scope, 'EnvConfigBucket', {
    bucketName: `${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-config`,
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
    bucketName: `${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-artifacts`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    bucketKeyEnabled: true,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: enableVersioning,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
  });

  // ELB logs bucket with globally unique naming (ALB and NLB)
  const elbLogsBucket = new s3.Bucket(scope, 'ElbLogsBucket', {
    bucketName: `${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-elblogs`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: removalPolicy !== 'RETAIN',
    lifecycleRules: [{
      id: 'MonthlyDelete',
      expiration: cdk.Duration.days(elbLogsRetentionDays),
      enabled: true
    }]
  });

  // Grant ELB service account permission to write access logs (ALB and NLB)
  const elbServiceAccountMap: { [key: string]: { accountId: string, partition: string } } = {
    'us-east-1': { accountId: '127311923021', partition: 'aws' }, 'us-east-2': { accountId: '033677994240', partition: 'aws' }, 'us-west-1': { accountId: '027434742980', partition: 'aws' }, 'us-west-2': { accountId: '797873946194', partition: 'aws' },
    'ca-central-1': { accountId: '985666609251', partition: 'aws' }, 'eu-central-1': { accountId: '054676820928', partition: 'aws' }, 'eu-west-1': { accountId: '156460612806', partition: 'aws' }, 'eu-west-2': { accountId: '652711504416', partition: 'aws' },
    'eu-west-3': { accountId: '009996457667', partition: 'aws' }, 'eu-north-1': { accountId: '897822967062', partition: 'aws' }, 'eu-south-1': { accountId: '635631232127', partition: 'aws' }, 'ap-east-1': { accountId: '754344448648', partition: 'aws' },
    'ap-northeast-1': { accountId: '582318560864', partition: 'aws' }, 'ap-northeast-2': { accountId: '600734575887', partition: 'aws' }, 'ap-northeast-3': { accountId: '383597477331', partition: 'aws' }, 'ap-southeast-1': { accountId: '114774131450', partition: 'aws' },
    'ap-southeast-2': { accountId: '783225319266', partition: 'aws' }, 'ap-southeast-3': { accountId: '589379963580', partition: 'aws' }, 'ap-south-1': { accountId: '718504428378', partition: 'aws' }, 'me-south-1': { accountId: '076674570225', partition: 'aws' },
    'sa-east-1': { accountId: '507241528517', partition: 'aws' }, 'af-south-1': { accountId: '098369216593', partition: 'aws' }, 'us-gov-west-1': { accountId: '048591011584', partition: 'aws-us-gov' }, 'us-gov-east-1': { accountId: '190560391635', partition: 'aws-us-gov' }
  };
  
  // Detect current partition based on region
  const isGovCloud = region.startsWith('us-gov-');
  const currentPartition = isGovCloud ? 'aws-us-gov' : 'aws';
  
  // Filter ELB service accounts by current partition only
  const filteredELBAccounts = Object.values(elbServiceAccountMap).filter(({ partition }) => 
    partition === currentPartition
  );
  
  // Create principals for ELB service accounts in current partition only
  const allELBPrincipals = filteredELBAccounts.map(({ accountId, partition }) => 
    new cdk.aws_iam.ArnPrincipal(`arn:${partition}:iam::${accountId}:root`)
  );
  
  // Apply permissions to ELB logs bucket
  [elbLogsBucket].forEach(bucket => {
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: allELBPrincipals,
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          's3:x-amz-acl': 'bucket-owner-full-control'
        }
      }
    }));
    
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: allELBPrincipals,
      actions: ['s3:GetBucketAcl', 's3:GetBucketPolicy'],
      resources: [bucket.bucketArn]
    }));

    // Add NLB log delivery service principal
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new cdk.aws_iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [bucket.bucketArn]
    }));

    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new cdk.aws_iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/*`]
    }));

    // Add ALB log delivery service principal
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new cdk.aws_iam.ServicePrincipal('logdelivery.elasticloadbalancing.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${bucket.bucketArn}/*`]
    }));



    // Allow account owner essential permissions for ELB logging and bucket management
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new AccountRootPrincipal()],
      actions: [
        's3:GetBucketAcl',
        's3:GetBucketTagging',
        's3:PutObject',
        's3:ListBucket',
        's3:DeleteObject'
      ],
      resources: [bucket.bucketArn, `${bucket.bucketArn}/*`]
    }));
  });

  return { envConfigBucket, appImagesBucket, elbLogsBucket };
}