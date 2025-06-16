import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
export declare function createKmsResources(scope: Construct, stackName: string): {
    kmsKey: kms.Key;
    kmsAlias: kms.Alias;
};
