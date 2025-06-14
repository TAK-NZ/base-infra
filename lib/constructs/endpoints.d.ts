import { Construct } from 'constructs';
import { GatewayVpcEndpoint, InterfaceVpcEndpoint, IVpc, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
export declare function createVpcEndpoints(scope: Construct, params: {
    vpc: IVpc;
    privateSubnets: string[];
    endpointSg?: ISecurityGroup;
    stackName: string;
    createVpcEndpoints: boolean;
}): Record<string, GatewayVpcEndpoint | InterfaceVpcEndpoint>;
