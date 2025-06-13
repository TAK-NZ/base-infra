import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare function createEcrResources(scope: Construct, stackName: string): {
    ecrRepo: cdk.aws_ecr.Repository;
};
