import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface VpcResources {
    vpc: ec2.CfnVPC;
    vpcCidrV6: ec2.CfnVPCCidrBlock;
    subnetPublicA: ec2.CfnSubnet;
    subnetPublicB: ec2.CfnSubnet;
    subnetPrivateA: ec2.CfnSubnet;
    subnetPrivateB: ec2.CfnSubnet;
    igw: ec2.CfnInternetGateway;
    egressOnlyIgw: ec2.CfnEgressOnlyInternetGateway;
    natEipA: ec2.CfnEIP;
    natEipB?: ec2.CfnEIP;
    natGatewayA: ec2.CfnNatGateway;
    natGatewayB?: ec2.CfnNatGateway;
    publicRouteTable: ec2.CfnRouteTable;
    privateRouteTableA: ec2.CfnRouteTable;
    privateRouteTableB: ec2.CfnRouteTable;
    endpointSg?: ec2.CfnSecurityGroup;
}
export declare function createVpcResources(scope: Construct, envType: string): VpcResources;
export declare function createVpcL2Resources(scope: Construct, vpcMajorId: number, vpcMinorId: number): ec2.Vpc;
