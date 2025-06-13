import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';

export function createS3Resources(scope: Construct, stackName: string, region: string, kmsKey: Key) {
  const configBucket = new s3.Bucket(scope, 'ConfigBucket', {
    bucketName: `${stackName.toLowerCase()}-${region}-env-config`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    // Ownership controls and public access block are handled by above props
  });
  return { configBucket };
}
