import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Fn } from 'aws-cdk-lib';

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
}

export function createVpcResources(scope: Construct, envType: string, createNatGateways: boolean): VpcResources {
  const stack = cdk.Stack.of(scope);
  const stackName = Fn.ref('AWS::StackName');

  // Direct VPC CIDR block values for simplicity
  const vpcCidr = '10.0.0.0/16';

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
  if (createNatGateways) {
    natEipB = new ec2.CfnEIP(scope, 'NatPublicIPB', {
      domain: 'vpc',
      tags: [{ key: 'Name', value: stackName }],
    });
  }

  const natGatewayA = new ec2.CfnNatGateway(scope, 'NatGatewayA', {
    subnetId: subnetPublicA.ref,
    allocationId: natEipA.attrAllocationId,
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-a']) }],
  });

  let natGatewayB: ec2.CfnNatGateway | undefined;
  if (createNatGateways && natEipB) {
    natGatewayB = new ec2.CfnNatGateway(scope, 'NatGatewayB', {
      subnetId: subnetPublicB.ref,
      allocationId: natEipB.attrAllocationId,
      tags: [{ key: 'Name', value: Fn.join('', [stackName, '-subnet-b']) }],
    });
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
  if (createNatGateways && natGatewayB) {
    privateRouteB = new ec2.CfnRoute(scope, 'PrivateRouteB', {
      routeTableId: privateRouteTableB.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGatewayB.ref,
    });
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
  };
}

export function createVpcL2Resources(scope: Construct, vpcMajorId: number, vpcMinorId: number, createNatGateways: boolean): ec2.Vpc {
  return new ec2.Vpc(scope, 'Vpc', {
    ipAddresses: ec2.IpAddresses.cidr(`10.${vpcMajorId}.0.0/16`),
    maxAzs: 2,
    natGateways: createNatGateways ? 2 : 1, // 1 NAT Gateway always, 2 for redundancy
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    ],
  });
}
