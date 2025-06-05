import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';

export function createS3Resources(scope: Construct, stackName: string, region: string, kmsAliasRef: string) {
  const configBucket = new s3.CfnBucket(scope, 'ConfigBucket', {
    bucketName: `${stackName}-${region}-env-config`,
    ownershipControls: {
      rules: [{ objectOwnership: 'BucketOwnerEnforced' }],
    },
    bucketEncryption: {
      serverSideEncryptionConfiguration: [{
        serverSideEncryptionByDefault: {
          kmsMasterKeyId: kmsAliasRef,
          sseAlgorithm: 'aws:kms',
        },
        bucketKeyEnabled: true,
      }],
    },
    publicAccessBlockConfiguration: {
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
  });
  configBucket.applyRemovalPolicy(RemovalPolicy.DESTROY);
  return { configBucket };
}
