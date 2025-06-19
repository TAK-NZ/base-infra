import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

export interface VpcResources {
  vpc: ec2.Vpc;
  ipv6CidrBlock?: ec2.CfnVPCCidrBlock;
  vpcLogicalId: string;
}

/**
 * Creates VPC with optional IPv6 support
 * Simplified approach using standard L2 constructs
 */
export function createVpcL2Resources(
  scope: Construct,
  vpcCidr: string = '10.0.0.0/20',
  createNatGateways: boolean
): VpcResources {
  const vpc = new ec2.Vpc(scope, 'Vpc', {
    ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
    maxAzs: 2,
    natGateways: createNatGateways ? 2 : 0,
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

  // Optional IPv6 support - can be added via CDK feature flags if needed
  let ipv6CidrBlock: ec2.CfnVPCCidrBlock | undefined;
  if (scope.node.tryGetContext('enableIpv6')) {
    ipv6CidrBlock = new ec2.CfnVPCCidrBlock(scope, 'VpcIpv6CidrBlock', {
      vpcId: vpc.vpcId,
      amazonProvidedIpv6CidrBlock: true,
    });
  }

  return {
    vpc,
    ipv6CidrBlock,
    vpcLogicalId: (vpc.node.defaultChild as ec2.CfnVPC).logicalId,
  };
}
