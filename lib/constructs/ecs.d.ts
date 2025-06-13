import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
export declare function createEcsResources(scope: Construct, stackName: string, vpc: ec2.IVpc): {
    ecsCluster: ecs.Cluster;
};
