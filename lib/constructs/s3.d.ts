import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms';
export declare function createS3Resources(scope: Construct, stackName: string, region: string, kmsKey: Key): {
    configBucket: s3.Bucket;
};
