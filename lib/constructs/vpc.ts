import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Fn, Tags } from 'aws-cdk-lib';

export interface VpcResources {
  vpc: ec2.Vpc;
  ipv6CidrBlock: ec2.CfnVPCCidrBlock;
  vpcLogicalId: string;
}

/**
 * Properties for the VPC construct
 */
export interface BaseInfraVpcProps {
  readonly vpcCidr: string;
  readonly createNatGateways: boolean;
}

/**
 * Custom VPC construct with IPv4/IPv6 dual-stack support
 * 
 * Uses a hybrid approach:
 * - L2 VPC construct (ec2.Vpc) for standard VPC setup and best practices
 * - L1 constructs (CfnVPCCidrBlock, CfnEgressOnlyInternetGateway) for IPv6 support
 * - Proper IPv6 routing for both public and private subnets
 */
export class BaseInfraVpc extends ec2.Vpc {
  public readonly ipv6CidrBlockResource: ec2.CfnVPCCidrBlock;
  public readonly vpcLogicalId: string;
  public readonly egressOnlyInternetGatewayId: string;

  constructor(scope: Construct, id: string, props: BaseInfraVpcProps) {
    super(scope, id, {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      maxAzs: 2,
      natGateways: props.createNatGateways ? 2 : 1, // 1 NAT Gateway always, 2 for redundancy
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

    Tags.of(this).add('Name', this.node.path);

    // Set up IPv6 dual-stack networking
    this.ipv6CidrBlockResource = this.setupIpv6();
    this.vpcLogicalId = (this.node.defaultChild as ec2.CfnVPC).logicalId;
    this.egressOnlyInternetGatewayId = this.setupIpv6Routing(this.ipv6CidrBlockResource);
  }

  private setupIpv6(): ec2.CfnVPCCidrBlock {
    // Add IPv6 support to the VPC
    const ipv6CidrBlock = new ec2.CfnVPCCidrBlock(this, 'VpcIpv6CidrBlock', {
      vpcId: this.vpcId,
      amazonProvidedIpv6CidrBlock: true,
    });

    // Enable IPv6 on all subnets using clean CDK utilities
    const vpcLogicalId = (this.node.defaultChild as ec2.CfnVPC).logicalId;
    
    // Get the IPv6 CIDR block using clean CDK utilities
    const vpcIpv6CidrBlock = Fn.select(0, this.vpcIpv6CidrBlocks);
    
    // Slice our ::/56 CIDR block into 256 chunks of ::/64 CIDRs
    const subnetIpv6CidrBlocks = Fn.cidr(vpcIpv6CidrBlock, 256, "64");

    // Associate an IPv6 CIDR sub-block to each subnet
    [
      ...this.publicSubnets,
      ...this.privateSubnets,
      ...this.isolatedSubnets,
    ].forEach((subnet, i) => {
      subnet.node.addDependency(ipv6CidrBlock);
      const cfnSubnet = subnet.node.defaultChild as ec2.CfnSubnet;
      cfnSubnet.ipv6CidrBlock = Fn.select(i, subnetIpv6CidrBlocks);
      cfnSubnet.assignIpv6AddressOnCreation = true;
    });

    return ipv6CidrBlock;
  }

  private setupIpv6Routing(ipv6CidrBlock: ec2.CfnVPCCidrBlock): string {
    // Add IPv6 routes for public subnets via Internet Gateway
    if (this.internetGatewayId) {
      this.publicSubnets.forEach((subnet, index) => {
        const route = new ec2.CfnRoute(this, `PublicIpv6Route${index}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationIpv6CidrBlock: '::/0',
          gatewayId: this.internetGatewayId,
        });
        // Ensure route waits for IPv6 CIDR block to be associated
        route.node.addDependency(ipv6CidrBlock);
      });
    }

    // Add Egress-Only Internet Gateway for private subnets IPv6 traffic
    const egressOnlyIgw = new ec2.CfnEgressOnlyInternetGateway(this, 'EgressOnlyIgw', {
      vpcId: this.vpcId,
    });

    // Add name tag to the Egress-Only Internet Gateway
    egressOnlyIgw.addOverride('Properties.Tags', [
      {
        Key: 'Name',
        Value: `${this.node.id}-EgressOnlyIgw`
      }
    ]);

    // Add IPv6 routes for private subnets to use Egress-Only Internet Gateway
    this.isolatedSubnets.concat(this.privateSubnets).forEach((subnet, index) => {
      if (this.privateSubnets.includes(subnet)) {
        const privateIndex = this.privateSubnets.indexOf(subnet);
        
        const route = new ec2.CfnRoute(this, `PrivateIpv6Route${privateIndex}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationIpv6CidrBlock: '::/0',
          egressOnlyInternetGatewayId: egressOnlyIgw.ref,
        });
        // Ensure route waits for IPv6 CIDR block to be associated
        route.node.addDependency(ipv6CidrBlock);
      }
    });

    return egressOnlyIgw.ref;
  }
}

/**
 * Creates VPC with IPv6 support and proper routing
 * Maintains compatibility with existing function-based approach
 */
export function createVpcL2Resources(
  scope: Construct,
  vpcCidr: string = '10.0.0.0/20',
  createNatGateways: boolean
): VpcResources {
  const vpc = new BaseInfraVpc(scope, 'Vpc', {
    vpcCidr,
    createNatGateways,
  });

  return {
    vpc,
    ipv6CidrBlock: vpc.ipv6CidrBlockResource,
    vpcLogicalId: vpc.vpcLogicalId,
  };
}
