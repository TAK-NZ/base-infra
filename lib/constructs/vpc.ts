import * as cdk from 'aws-cdk-lib';
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
 * @param scope - The construct scope
 * @param vpcCidr - The IPv4 CIDR block for the VPC (defaults to 10.0.0.0/20)
 * @param createNatGateways - Whether to create NAT gateways for high availability
 * @returns Object containing the VPC, IPv6 CIDR block, and VPC logical ID for use in outputs
 */
export function createVpcL2Resources(scope: Construct, vpcCidr: string = '10.0.0.0/20', createNatGateways: boolean): { vpc: ec2.Vpc; ipv6CidrBlock: ec2.CfnVPCCidrBlock; vpcLogicalId: string } {
  const vpc = new ec2.Vpc(scope, 'Vpc', {
    ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
    maxAzs: 2,
    natGateways: createNatGateways ? 2 : 1, // 1 NAT Gateway always, 2 for redundancy
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
        mapPublicIpOnLaunch: true,
      },
      {
        cidrMask: 24,
        name: 'private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    ],
  });

  // Add IPv6 support to the VPC
  const ipv6CidrBlock = new ec2.CfnVPCCidrBlock(scope, 'VpcIpv6CidrBlock', {
    vpcId: vpc.vpcId,
    amazonProvidedIpv6CidrBlock: true,
  });

  // Enable IPv6 on all subnets using CloudFormation intrinsic functions
  const vpcLogicalId = (vpc.node.defaultChild as ec2.CfnVPC).logicalId;
  
  vpc.publicSubnets.forEach((subnet, index) => {
    const cfnSubnet = subnet.node.defaultChild as ec2.CfnSubnet;
    // Use the VPC's Ipv6CidrBlocks attribute instead of the VPCCidrBlock's Ipv6CidrBlock
    cfnSubnet.ipv6CidrBlock = {
      "Fn::Select": [
        index,
        {
          "Fn::Cidr": [
            {
              "Fn::Select": [
                0,
                {
                  "Fn::GetAtt": [
                    vpcLogicalId,
                    "Ipv6CidrBlocks"
                  ]
                }
              ]
            },
            256,
            64
          ]
        }
      ]
    } as any;
    cfnSubnet.assignIpv6AddressOnCreation = true;
    cfnSubnet.addDependency(ipv6CidrBlock);
  });

  vpc.privateSubnets.forEach((subnet, index) => {
    const cfnSubnet = subnet.node.defaultChild as ec2.CfnSubnet;
    // Use the VPC's Ipv6CidrBlocks attribute instead of the VPCCidrBlock's Ipv6CidrBlock
    cfnSubnet.ipv6CidrBlock = {
      "Fn::Select": [
        index + vpc.publicSubnets.length,
        {
          "Fn::Cidr": [
            {
              "Fn::Select": [
                0,
                {
                  "Fn::GetAtt": [
                    vpcLogicalId,
                    "Ipv6CidrBlocks"
                  ]
                }
              ]
            },
            256,
            64
          ]
        }
      ]
    } as any;
    cfnSubnet.assignIpv6AddressOnCreation = true;
    cfnSubnet.addDependency(ipv6CidrBlock);
  });

  // Add Egress-Only Internet Gateway for private subnets IPv6 traffic
  const egressOnlyIgw = new ec2.CfnEgressOnlyInternetGateway(scope, 'EgressOnlyIgw', {
    vpcId: vpc.vpcId,
  });

  // Add name tag to the Egress-Only Internet Gateway using addOverride
  egressOnlyIgw.addOverride('Properties.Tags', [
    {
      Key: 'Name',
      Value: `${scope.node.id}-EgressOnlyIgw`
    }
  ]);

  // Add IPv6 routes for private subnets to use Egress-Only Internet Gateway
  // Since L2 VPC construct doesn't provide direct access to individual route tables,
  // we'll add the routes by iterating through isolated subnets and finding their route tables
  vpc.isolatedSubnets.concat(vpc.privateSubnets).forEach((subnet, index) => {
    // Only process private subnets (skip isolated if any)
    if (vpc.privateSubnets.includes(subnet)) {
      const privateIndex = vpc.privateSubnets.indexOf(subnet);
      
      // Create the IPv6 route using the subnet's route table ID
      // We'll use a more direct approach with CloudFormation
      new ec2.CfnRoute(scope, `PrivateIpv6Route${privateIndex}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationIpv6CidrBlock: '::/0',
        egressOnlyInternetGatewayId: egressOnlyIgw.ref,
      });
    }
  });

  // The L2 VPC construct automatically handles IPv4 routing and IPv6 routing for public subnets
  // but we need to manually add IPv6 egress routes for private subnets

  return { vpc, ipv6CidrBlock, vpcLogicalId };
}
