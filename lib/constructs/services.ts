import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
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
      { tagPrefixList: ['retention-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['data-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['cloudtak-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['takteammanager-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['mediamtx-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['utils-tileserver-gl-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['utils-weather-proxy-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['utils-ais-proxy-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['utils-grid-monitor-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['utils-terrain-proxy-'], maxImageCount: imageRetentionCount },
      { tagPrefixList: ['utils-display-proxy-'], maxImageCount: imageRetentionCount },
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
      // { tagPrefixList: ['etl-adsbx-'], maxImageCount: imageRetentionCount },
      // { tagPrefixList: ['etl-earthquakes-'], maxImageCount: imageRetentionCount },
      // { tagPrefixList: ['etl-geojson-'], maxImageCount: imageRetentionCount },
      // { tagPrefixList: ['etl-inreach-'], maxImageCount: imageRetentionCount },
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

/**
 * S3 bucket for large, user-downloadable offline map files (regional/marine
 * raster mbtiles, NZ OMT vector mbtiles, etc). Kept separate from
 * appImagesBucket ("artifacts") because that bucket is an internal
 * build-staging area written by CI with deploy credentials and read by ECS
 * tasks -- granting a downstream consumer (e.g. TAK Team Manager, to mint
 * presigned download URLs) access to it would implicitly expose everything
 * else that ever lands there. This bucket holds only things intentionally
 * offered for download.
 */
export function createMapDownloadsBucket(scope: Construct, stackName: string, region: string, removalPolicy: string) {
  const mapDownloadsBucket = new s3.Bucket(scope, 'MapDownloadsBucket', {
    bucketName: `${stackName.toLowerCase()}-${region}-${cdk.Aws.ACCOUNT_ID}-map-downloads`,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    versioned: false,
    removalPolicy: removalPolicy === 'RETAIN' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    lifecycleRules: [{
      id: 'AbortIncompleteMultipartUploads',
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
      enabled: true,
    }],
  });

  return { mapDownloadsBucket };
}

/**
 * IAM role + instance profile for the one-off, manually-launched EC2 build
 * instance that generates large offline map files (see
 * utils-infra/offline-maps/). This is a persistent, auditable piece of
 * infrastructure even though the EC2 instance itself is ephemeral and
 * launched imperatively (not via CDK) -- the role's permissions are exactly
 * what that build script needs and nothing else:
 *   - read the LINZ API key from the env config bucket
 *   - write output mbtiles to the map downloads bucket
 *   - read LINZ/building-heights source and write the two NZ OMT vector
 *     mbtiles outputs to the artifacts bucket, plus the specific ECS
 *     describe/register/update calls needed to force tileserver-gl to
 *     re-download them (this build used to run monthly on GitHub Actions;
 *     folded into this instance's annual run since it shares the same LINZ
 *     API key and disk -- see utils-infra/offline-maps/user-data.sh)
 *   - publish progress/completion notifications to SNS
 *   - SSM Session Manager for interactive access, with no inbound ports open
 */
export function createMapBuildInstanceRole(
  scope: Construct,
  stackName: string,
  envConfigBucket: s3.Bucket,
  mapDownloadsBucket: s3.Bucket,
  appImagesBucket: s3.Bucket,
  ecsCluster: ecs.Cluster,
  kmsKey: kms.Key,
) {
  // Progress/completion notifications -- subscribe an email/Slack endpoint to
  // this topic out of band (console or a follow-up subscription resource);
  // left unsubscribed here since the notification target is an operational
  // choice, not infrastructure.
  const buildNotificationsTopic = new sns.Topic(scope, 'MapBuildNotificationsTopic', {
    topicName: `${stackName}-MapBuildNotifications`,
    displayName: 'Offline map build instance notifications',
  });

  const role = new cdk.aws_iam.Role(scope, 'MapBuildInstanceRole', {
    roleName: `${stackName}-MapBuildInstance`,
    assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
    description: 'One-off EC2 instance role for generating large offline map mbtiles files',
    managedPolicies: [
      // SSM Session Manager access -- no inbound SSH required
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
    ],
  });

  // Read-only access to the LINZ API key config object
  envConfigBucket.grantRead(role, 'Utils-Terrain-Proxy-Config.json');
  kmsKey.grantDecrypt(role);

  // Read (resume support) + write access to the map downloads bucket
  mapDownloadsBucket.grantReadWrite(role);

  // The NZ OMT vector basemap build (folded into this same annual instance,
  // see utils-infra/offline-maps/user-data.sh step 6) reads the LINZ source +
  // building-heights archives from, and writes its two output mbtiles back
  // to, the *artifacts* bucket -- not map-downloads. That bucket holds
  // internal build inputs/outputs consumed by tileserver-gl, unlike
  // map-downloads which is user-facing; see createMapDownloadsBucket's
  // comment for that distinction. Read+write here only, no delete: this
  // instance overwrites the same few well-known keys, it never needs to
  // remove anything else that lives in that bucket.
  appImagesBucket.grantRead(role);
  appImagesBucket.grantPut(role);

  // After uploading a refreshed NZ OMT tileset, force tileserver-gl to
  // re-download it from S3 by registering a new task definition revision
  // (with FORCE_DOWNLOAD=true on the tile-downloader init container) and
  // updating the service -- the same mechanism
  // .github/workflows/update-linz-tiles.yml used to perform from CI.
  // Read-only describe/list plus exactly the two mutating calls needed;
  // no broader ecs:* access.
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ecs:ListServices',
      'ecs:DescribeServices',
      'ecs:DescribeTaskDefinition',
    ],
    resources: ['*'],  // Describe/List ECS APIs do not support resource-level
                        // scoping to a specific cluster ARN.
  }));
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ecs:RegisterTaskDefinition'],
    resources: ['*'],  // RegisterTaskDefinition has no meaningful resource
                        // scope either -- it registers a new family/revision.
  }));
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ecs:UpdateService'],
    resources: [
      `arn:${cdk.Aws.PARTITION}:ecs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:service/${ecsCluster.clusterName}/*`,
    ],
  }));
  // iam:PassRole for the tileserver-gl task/execution roles is required by
  // RegisterTaskDefinition -- ECS validates the caller can pass those roles
  // when it registers a revision reusing them. Scoped to roles tagged for
  // this cluster's tasks rather than left open.
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['iam:PassRole'],
    resources: [`arn:${cdk.Aws.PARTITION}:iam::${cdk.Aws.ACCOUNT_ID}:role/*`],
    conditions: {
      StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' },
    },
  }));

  buildNotificationsTopic.grantPublish(role);

  // Allow the instance to terminate itself on completion/failure, scoped to
  // instances carrying this build's tag -- avoids needing a broader
  // ec2:TerminateInstances grant.
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ec2:TerminateInstances'],
    resources: ['*'],
    conditions: {
      StringEquals: { 'ec2:ResourceTag/Purpose': 'offline-map-build' },
    },
  }));

  const instanceProfile = new cdk.aws_iam.InstanceProfile(scope, 'MapBuildInstanceProfile', {
    instanceProfileName: `${stackName}-MapBuildInstance`,
    role,
  });

  // Execution role for the one-time EventBridge Scheduler "stale instance"
  // safety net that launch-build-instance.sh creates per launch. If the
  // build script crashes before reaching its own self-termination call, this
  // is what force-terminates the instance instead of it running unattended
  // (and billing) indefinitely. Scoped identically to the instance role's own
  // self-termination permission above -- same tag condition, same action.
  const schedulerRole = new cdk.aws_iam.Role(scope, 'MapBuildSchedulerRole', {
    roleName: `${stackName}-MapBuildScheduler`,
    assumedBy: new cdk.aws_iam.ServicePrincipal('scheduler.amazonaws.com'),
    description: 'EventBridge Scheduler execution role for the offline map build stale-instance safety net',
  });
  schedulerRole.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ec2:TerminateInstances'],
    resources: ['*'],
    conditions: {
      StringEquals: { 'ec2:ResourceTag/Purpose': 'offline-map-build' },
    },
  }));

  return { role, instanceProfile, buildNotificationsTopic, schedulerRole };
}