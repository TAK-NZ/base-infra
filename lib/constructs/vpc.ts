import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

export interface VpcResources {
  vpc: ec2.Vpc;
  ipv6CidrBlock: ec2.CfnVPCCidrBlock;
  vpcLogicalId: string;
}

/**
 * Creates VPC with IPv6 support enabled by default
 * Includes full IPv6 configuration with proper routing
 */
export function createVpcL2Resources(
  scope: Construct,
  vpcCidr: string = '10.0.0.0/20',
  enableRedundantNatGateways: boolean
): VpcResources {
  const vpc = new ec2.Vpc(scope, 'Vpc', {
    ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
    maxAzs: 2,
    natGateways: enableRedundantNatGateways ? 2 : 1,
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

  cdk.Tags.of(vpc).add('Name', vpc.node.path);

  // IPv6 configuration - always enabled
  const ipv6CidrBlock = new ec2.CfnVPCCidrBlock(scope, 'VpcIpv6CidrBlock', {
    vpcId: vpc.vpcId,
    amazonProvidedIpv6CidrBlock: true,
  });

  // Configure IPv6 for all subnets and routing
  configureIpv6Subnets(scope, vpc, ipv6CidrBlock);

  return {
    vpc,
    ipv6CidrBlock,
    vpcLogicalId: (vpc.node.defaultChild as ec2.CfnVPC).logicalId,
  };
}

/**
 * Configures IPv6 for VPC subnets and sets up proper routing
 */
function configureIpv6Subnets(
  scope: Construct,
  vpc: ec2.Vpc,
  ipv6CidrBlock: ec2.CfnVPCCidrBlock
): void {
  // Create Egress-Only Internet Gateway for private subnets
  const eigw = new ec2.CfnEgressOnlyInternetGateway(scope, 'EgressOnlyInternetGateway', {
    vpcId: vpc.vpcId,    
  });
  eigw.addDependency(ipv6CidrBlock);

  // Get Internet Gateway for public subnets (created by VPC construct)
  const internetGateway = vpc.node.findChild('IGW') as ec2.CfnInternetGateway;

  // Configure public subnets for IPv6
  vpc.publicSubnets.forEach((subnet, index) => {
    const subnetCfn = subnet.node.defaultChild as ec2.CfnSubnet;
    
    // Assign IPv6 CIDR to subnet
    subnetCfn.ipv6CidrBlock = cdk.Fn.select(index, cdk.Fn.cidr(
      cdk.Fn.select(0, vpc.vpcIpv6CidrBlocks), 
      4, // Total subnets (2 public + 2 private)
      '64' // IPv6 subnet size
    ));
    subnetCfn.assignIpv6AddressOnCreation = true;
    subnetCfn.addDependency(ipv6CidrBlock);

    // Add IPv6 route to Internet Gateway
    const ipv6Route = new ec2.CfnRoute(scope, `PublicSubnetIpv6Route${index}`, {
      routeTableId: subnet.routeTable.routeTableId,
      destinationIpv6CidrBlock: '::/0',
      gatewayId: internetGateway.ref,
    });
    ipv6Route.addDependency(internetGateway);
    ipv6Route.addDependency(ipv6CidrBlock);
  });

  // Configure private subnets for IPv6
  vpc.privateSubnets.forEach((subnet, index) => {
    const subnetCfn = subnet.node.defaultChild as ec2.CfnSubnet;
    
    // Assign IPv6 CIDR to subnet (offset by number of public subnets)
    subnetCfn.ipv6CidrBlock = cdk.Fn.select(index + vpc.publicSubnets.length, cdk.Fn.cidr(
      cdk.Fn.select(0, vpc.vpcIpv6CidrBlocks), 
      4, // Total subnets (2 public + 2 private)
      '64' // IPv6 subnet size
    ));
    subnetCfn.assignIpv6AddressOnCreation = true;
    subnetCfn.addDependency(ipv6CidrBlock);

    // Add IPv6 route to Egress-Only Internet Gateway
    const ipv6Route = new ec2.CfnRoute(scope, `PrivateSubnetIpv6Route${index}`, {
      routeTableId: subnet.routeTable.routeTableId,
      destinationIpv6CidrBlock: '::/0',
      egressOnlyInternetGatewayId: eigw.ref,
    });
    ipv6Route.addDependency(eigw);
    ipv6Route.addDependency(ipv6CidrBlock);
  });
}
