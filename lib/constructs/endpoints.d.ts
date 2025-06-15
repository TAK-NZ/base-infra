import { Construct } from 'constructs';
import { GatewayVpcEndpoint, InterfaceVpcEndpoint, IVpc, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
export declare function createVpcEndpoints(scope: Construct, params: {
    vpc: IVpc;
    endpointSg?: ISecurityGroup;
    createVpcEndpoints: boolean;
}): Record<string, GatewayVpcEndpoint | InterfaceVpcEndpoint>;
