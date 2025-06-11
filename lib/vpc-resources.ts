import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Fn, CfnCondition, CfnParameter } from 'aws-cdk-lib';

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

export function createVpcResources(scope: Construct, envType: string, vpcMajorIdParam: CfnParameter, vpcMinorIdParam: CfnParameter, prodCondition: CfnCondition): VpcResources {
  const isProd = envType === 'prod';
  const stack = cdk.Stack.of(scope);
  const stackName = Fn.ref('AWS::StackName');
  
  // Use CloudFormation native Fn::Cidr to calculate /20 CIDR block
  // Two-level approach using separate Major and Minor IDs:
  // Level 1: Major ID (0-255) selects one of 256 /16 blocks from 10.0.0.0/8
  // Level 2: Minor ID (0-15) selects one of 16 /20 blocks from the chosen /16 block
  // Total: 256 * 16 = 4096 possible /20 subnets
  
  // First, get the /16 CIDR block from 10.0.0.0/8 using Major ID
  const vpc16Block = { "Fn::Select": [
    { "Ref": vpcMajorIdParam.logicalId },
    { "Fn::Cidr": ["10.0.0.0/8", 256, 16] }
  ] } as any;
  
  // Then, get the /20 subnet from within that /16 block using Minor ID
  const vpcCidr = { "Fn::Select": [
    { "Ref": vpcMinorIdParam.logicalId },
    { "Fn::Cidr": [vpc16Block, 16, 12] }
  ] } as any;
  
  const vpc = new ec2.CfnVPC(scope, 'VPC', {
    cidrBlock: vpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: [{ key: 'Name', value: stackName }],
  });

  const vpcCidrV6 = new ec2.CfnVPCCidrBlock(scope, 'VPCCIDR', {
    vpcId: vpc.ref,
    amazonProvidedIpv6CidrBlock: true,
  });

  // Use 256 subnets for full parity with cfn.json
  // Subnets using raw CloudFormation intrinsics for CIDR
  const subnetPublicA = new ec2.CfnSubnet(scope, 'SubnetPublicA', {
    vpcId: vpc.ref,
    availabilityZone: { "Fn::Select": [0, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] } as any,
    cidrBlock: { "Fn::Select": [0, { "Fn::Cidr": [ { "Fn::GetAtt": [vpc.logicalId, "CidrBlock"] }, 16, 8 ] }] } as any,
    ipv6CidrBlock: { "Fn::Select": [0, { "Fn::Cidr": [ { "Fn::Select": [0, { "Fn::GetAtt": [vpc.logicalId, "Ipv6CidrBlocks"] } ] }, 256, 64 ] }] } as any,
    assignIpv6AddressOnCreation: true,
    mapPublicIpOnLaunch: true,
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-public-a']) }],
  });
  subnetPublicA.addDependency(vpcCidrV6);

  const subnetPublicB = new ec2.CfnSubnet(scope, 'SubnetPublicB', {
    vpcId: vpc.ref,
    availabilityZone: { "Fn::Select": [1, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] } as any,
    cidrBlock: { "Fn::Select": [1, { "Fn::Cidr": [ { "Fn::GetAtt": [vpc.logicalId, "CidrBlock"] }, 16, 8 ] }] } as any,
    ipv6CidrBlock: { "Fn::Select": [1, { "Fn::Cidr": [ { "Fn::Select": [0, { "Fn::GetAtt": [vpc.logicalId, "Ipv6CidrBlocks"] } ] }, 256, 64 ] }] } as any,
    assignIpv6AddressOnCreation: true,
    mapPublicIpOnLaunch: true,
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-public-b']) }],
  });
  subnetPublicB.addDependency(vpcCidrV6);

  const subnetPrivateA = new ec2.CfnSubnet(scope, 'SubnetPrivateA', {
    vpcId: vpc.ref,
    availabilityZone: { "Fn::Select": [0, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] } as any,
    cidrBlock: { "Fn::Select": [2, { "Fn::Cidr": [ { "Fn::GetAtt": [vpc.logicalId, "CidrBlock"] }, 16, 8 ] }] } as any,
    ipv6CidrBlock: { "Fn::Select": [2, { "Fn::Cidr": [ { "Fn::Select": [0, { "Fn::GetAtt": [vpc.logicalId, "Ipv6CidrBlocks"] } ] }, 256, 64 ] }] } as any,
    assignIpv6AddressOnCreation: true,
    mapPublicIpOnLaunch: false,
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-private-a']) }],
  });

  const subnetPrivateB = new ec2.CfnSubnet(scope, 'SubnetPrivateB', {
    vpcId: vpc.ref,
    availabilityZone: { "Fn::Select": [1, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] } as any,
    cidrBlock: { "Fn::Select": [3, { "Fn::Cidr": [ { "Fn::GetAtt": [vpc.logicalId, "CidrBlock"] }, 16, 8 ] }] } as any,
    ipv6CidrBlock: { "Fn::Select": [3, { "Fn::Cidr": [ { "Fn::Select": [0, { "Fn::GetAtt": [vpc.logicalId, "Ipv6CidrBlocks"] } ] }, 256, 64 ] }] } as any,
    assignIpv6AddressOnCreation: true,
    mapPublicIpOnLaunch: false,
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-private-b']) }],
  });

  const igw = new ec2.CfnInternetGateway(scope, 'InternetGateway', {
    tags: [
      { key: 'Name', value: stackName },
      { key: 'Network', value: 'Public' },
    ],
  });

  const egressOnlyIgw = new ec2.CfnEgressOnlyInternetGateway(scope, 'EgressOnlyInternetGateway', {
    vpcId: vpc.ref,
  });

  const natEipA = new ec2.CfnEIP(scope, 'NatPublicIPA', {
    domain: 'vpc',
    tags: [{ key: 'Name', value: stackName }],
  });

  let natEipB: ec2.CfnEIP | undefined;
  if (isProd) {
    natEipB = new ec2.CfnEIP(scope, 'NatPublicIPB', {
      domain: 'vpc',
      tags: [{ key: 'Name', value: stackName }],
    });
    natEipB.cfnOptions.condition = prodCondition;
  }

  const natGatewayA = new ec2.CfnNatGateway(scope, 'NatGatewayA', {
    subnetId: subnetPublicA.ref,
    allocationId: natEipA.attrAllocationId,
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-a']) }],
  });

  let natGatewayB: ec2.CfnNatGateway | undefined;
  if (isProd && natEipB) {
    natGatewayB = new ec2.CfnNatGateway(scope, 'NatGatewayB', {
      subnetId: subnetPublicB.ref,
      allocationId: natEipB.attrAllocationId,
      tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-b']) }],
    });
    natGatewayB.cfnOptions.condition = prodCondition;
  }

  const publicRouteTable = new ec2.CfnRouteTable(scope, 'PublicRouteTable', {
    vpcId: vpc.ref,
    tags: [
      { key: 'Network', value: 'Public' },
      { key: 'Name', value: Fn.join('', [stackName, '-public']) },
    ],
  });

  const privateRouteTableA = new ec2.CfnRouteTable(scope, 'PrivateRouteTableA', {
    vpcId: vpc.ref,
    tags: [
      { key: 'Network', value: 'Private' },
      { key: 'Name', value: Fn.join('', [stackName, '-private-subnet-a']) },
    ],
  });

  const privateRouteTableB = new ec2.CfnRouteTable(scope, 'PrivateRouteTableB', {
    vpcId: vpc.ref,
    tags: [
      { key: 'Network', value: 'Private' },
      { key: 'Name', value: Fn.join('', [stackName, '-private-subnet-b']) },
    ],
  });

  let endpointSg: ec2.CfnSecurityGroup | undefined;
  if (isProd) {
    endpointSg = new ec2.CfnSecurityGroup(scope, 'EndpointSecurityGroup', {
      groupName: `${stackName}-endpoint-sg`,
      groupDescription: 'Access to Endpoint services',
      vpcId: vpc.ref,
      securityGroupIngress: [{
        ipProtocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrIp: Fn.getAtt(vpc.logicalId, 'CidrBlock') as any,
      }],
      tags: [{ key: 'Name', value: `${stackName}-endpoint-sg` }],
    });
    endpointSg.cfnOptions.condition = prodCondition;
  }

  // Add explicit route table associations and routes for parity with cfn.json
  // Public subnet associations
  const subnetPublicAAssoc = new ec2.CfnSubnetRouteTableAssociation(scope, 'SubnetPublicAAssoc', {
    subnetId: subnetPublicA.ref,
    routeTableId: publicRouteTable.ref,
  });

  const subnetPublicBAssoc = new ec2.CfnSubnetRouteTableAssociation(scope, 'SubnetPublicBAssoc', {
    subnetId: subnetPublicB.ref,
    routeTableId: publicRouteTable.ref,
  });

  // Private subnet associations
  const subnetPrivateAAssoc = new ec2.CfnSubnetRouteTableAssociation(scope, 'SubnetPrivateAAssoc', {
    subnetId: subnetPrivateA.ref,
    routeTableId: privateRouteTableA.ref,
  });

  const subnetPrivateBAssoc = new ec2.CfnSubnetRouteTableAssociation(scope, 'SubnetPrivateBAssoc', {
    subnetId: subnetPrivateB.ref,
    routeTableId: privateRouteTableB.ref,
  });

  // Public routes (IPv4 and IPv6)
  const vpcIgwAttachment = new ec2.CfnVPCGatewayAttachment(scope, 'VPCIG', {
    vpcId: vpc.ref,
    internetGatewayId: igw.ref,
  });

  const publicRoute = new ec2.CfnRoute(scope, 'PublicRoute', {
    routeTableId: publicRouteTable.ref,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: igw.ref,
  });
  publicRoute.addDependency(vpcIgwAttachment);

  const publicRouteV6 = new ec2.CfnRoute(scope, 'PublicRouteV6', {
    routeTableId: publicRouteTable.ref,
    destinationIpv6CidrBlock: '::/0',
    gatewayId: igw.ref,
  });
  publicRouteV6.addDependency(vpcIgwAttachment);

  // Private routes (IPv4 and IPv6)
  const privateRouteA = new ec2.CfnRoute(scope, 'PrivateRouteA', {
    routeTableId: privateRouteTableA.ref,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId: natGatewayA.ref,
  });

  let privateRouteB: ec2.CfnRoute | undefined;
  if (isProd && natGatewayB) {
    privateRouteB = new ec2.CfnRoute(scope, 'PrivateRouteB', {
      routeTableId: privateRouteTableB.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGatewayB.ref,
    });
    privateRouteB.cfnOptions.condition = prodCondition;
  } else {
    privateRouteB = new ec2.CfnRoute(scope, 'PrivateRouteB', {
      routeTableId: privateRouteTableB.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGatewayA.ref,
    });
  }

  const privateRouteV6A = new ec2.CfnRoute(scope, 'PrivateRouteV6A', {
    routeTableId: privateRouteTableA.ref,
    destinationIpv6CidrBlock: '::/0',
    gatewayId: egressOnlyIgw.ref,
  });

  const privateRouteV6B = new ec2.CfnRoute(scope, 'PrivateRouteV6B', {
    routeTableId: privateRouteTableB.ref,
    destinationIpv6CidrBlock: '::/0',
    gatewayId: egressOnlyIgw.ref,
  });

  return {
    vpc,
    vpcCidrV6,
    subnetPublicA,
    subnetPublicB,
    subnetPrivateA,
    subnetPrivateB,
    igw,
    egressOnlyIgw,
    natEipA,
    natEipB,
    natGatewayA,
    natGatewayB,
    publicRouteTable,
    privateRouteTableA,
    privateRouteTableB,
    endpointSg,
  };
}
