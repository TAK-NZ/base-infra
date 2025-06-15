import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
/**
 * Creates a VPC using L2 constructs with IPv6 support.
 *
 * Uses a hybrid approach:
 * - L2 VPC construct (ec2.Vpc) for standard VPC setup and best practices
 * - L1 constructs (CfnVPCCidrBlock, CfnEgressOnlyInternetGateway) for IPv6 support
 *   since the L2 VPC construct doesn't natively support IPv6
 *
 * @returns Object containing the VPC, IPv6 CIDR block, and VPC logical ID for use in outputs
 */
export declare function createVpcL2Resources(scope: Construct, vpcMajorId: number, vpcMinorId: number, createNatGateways: boolean): {
    vpc: ec2.Vpc;
    ipv6CidrBlock: ec2.CfnVPCCidrBlock;
    vpcLogicalId: string;
};
