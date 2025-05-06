import cf from '@openaddresses/cloudfriend';

export default {
    Parameters: {
        VPCLocationId: {
            Description: 'Unique VPC ID per AWS regions (0-255)',
            Type: 'Number',
            Default: 0,
            MinValue: 0,
            MaxValue: 255
        }
    },
    Resources: {
        VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {
                EnableDnsHostnames: true,
                EnableDnsSupport: true,
                CidrBlock: cf.join(['10.', cf.ref('VPCLocationId'), '.0.0/16']),

                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName])
                }]
            }
        },
        VPCCIDR: {
            Type: 'AWS::EC2::VPCCidrBlock',
            Properties: {
                AmazonProvidedIpv6CidrBlock: true,
                VpcId: cf.ref('VPC')
            }
        },
        SubnetPublicA: {
            Type: 'AWS::EC2::Subnet',
            DependsOn: 'VPCCIDR',
            Properties: {
                AvailabilityZone: cf.select(0, cf.getAzs(cf.region)),
                VpcId: cf.ref('VPC'),
                CidrBlock: cf.select(0, cf.cidr(cf.getAtt('VPC', 'CidrBlock'),256,8)),                            // Select the first out of 256 possible /24 IPv4 subnets from the VPC /16 IPv4 CIDR
                Ipv6CidrBlock: cf.select(0, cf.cidr(cf.select(0, cf.getAtt('VPC', 'Ipv6CidrBlocks')),256,64)),    // Select the first out of 256 possible /64 IPv6 subnets from the VPC /56 IPv6 CIDR
                AssignIpv6AddressOnCreation: true,
                MapPublicIpOnLaunch: true,
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-public-a'])
                }]
            }
        },
        SubnetPublicB: {
            Type: 'AWS::EC2::Subnet',
            DependsOn: 'VPCCIDR',
            Properties: {
                AvailabilityZone: cf.select(1, cf.getAzs(cf.region)),
                VpcId: cf.ref('VPC'),
                CidrBlock: cf.select(1, cf.cidr(cf.getAtt('VPC', 'CidrBlock'),256,8)),                            // Select the second out of 256 possible /24 IPv4 subnets from the VPC /16 IPv4 CIDR
                Ipv6CidrBlock: cf.select(1, cf.cidr(cf.select(0, cf.getAtt('VPC', 'Ipv6CidrBlocks')),256,64)),    // Select the second out of 256 possible /64 IPv6 subnets from the VPC /56 IPv6 CIDR
                AssignIpv6AddressOnCreation: true,
                MapPublicIpOnLaunch: true,
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-public-b'])
                }]
            }
        },
        SubnetPrivateA: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                AvailabilityZone: cf.select(0, cf.getAzs(cf.region)),
                VpcId: cf.ref('VPC'),
                CidrBlock: cf.select(2, cf.cidr(cf.getAtt('VPC', 'CidrBlock'),256,8)),                            // Select the third out of 256 possible /24 IPv4 subnets from the VPC /16 IPv4 CIDR
                Ipv6CidrBlock: cf.select(2, cf.cidr(cf.select(0, cf.getAtt('VPC', 'Ipv6CidrBlocks')),256,64)),    // Select the third out of 256 possible /64 IPv6 subnets from the VPC /56 IPv6 CIDR
                AssignIpv6AddressOnCreation: true,
                MapPublicIpOnLaunch: false,
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-private-a'])
                }]
            }
        },
        SubnetPrivateB: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                AvailabilityZone: cf.select(1, cf.getAzs(cf.region)),
                VpcId: cf.ref('VPC'),
                CidrBlock: cf.select(3, cf.cidr(cf.getAtt('VPC', 'CidrBlock'),256,8)),                            // Select the third out of 256 possible /24 IPv4 subnets from the VPC /16 IPv4 CIDR
                Ipv6CidrBlock: cf.select(3, cf.cidr(cf.select(0, cf.getAtt('VPC', 'Ipv6CidrBlocks')),256,64)),    // Select the third out of 256 possible /64 IPv6 subnets from the VPC /56 IPv6 CIDR
                AssignIpv6AddressOnCreation: true,
                MapPublicIpOnLaunch: false,
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-private-b'])
                }]
            }
        },
        S3Endpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Properties: {
                VpcEndpointType: 'Gateway',
                RouteTableIds: [cf.ref('PublicRouteTable')],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.s3']),
                VpcId: cf.ref('VPC')
            }
        },
        InternetGateway: {
            Type: 'AWS::EC2::InternetGateway',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.stackName
                },{
                    Key: 'Network',
                    Value: 'Public'
                }]
            }
        },
        EgressOnlyInternetGateway: {
            Type: 'AWS::EC2::EgressOnlyInternetGateway',
            Properties: {
                VpcId: cf.ref('VPC')
            }
        },
        VPCIG: {
            Type: 'AWS::EC2::VPCGatewayAttachment',
            Properties: {
                InternetGatewayId: cf.ref('InternetGateway'),
                VpcId: cf.ref('VPC')
            }
        },
        PublicRouteTable: {
            Type: 'AWS::EC2::RouteTable',
            Properties: {
                VpcId: cf.ref('VPC'),
                Tags: [{
                    Key: 'Network',
                    Value: 'Public'
                },{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-public'])
                }]
            }
        },
        PublicRoute: {
            Type: 'AWS::EC2::Route',
            DependsOn:  'VPCIG',
            Properties: {
                RouteTableId: cf.ref('PublicRouteTable'),
                DestinationCidrBlock: '0.0.0.0/0',
                GatewayId: cf.ref('InternetGateway')
            }
        },
        PublicRouteV6: {
            Type: 'AWS::EC2::Route',
            DependsOn:  'VPCIG',
            Properties: {
                RouteTableId: cf.ref('PublicRouteTable'),
                DestinationIpv6CidrBlock: '::/0',
                GatewayId: cf.ref('InternetGateway')
            }
        },
        SubnetPublicAAssoc: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
                RouteTableId: cf.ref('PublicRouteTable'),
                SubnetId: cf.ref('SubnetPublicA')
            }
        },
        SubnetPublicBAssoc: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
                RouteTableId: cf.ref('PublicRouteTable'),
                SubnetId: cf.ref('SubnetPublicB')
            }
        },
        NatGatewayA: {
            Type: 'AWS::EC2::NatGateway',
            Properties:  {
                AllocationId: cf.getAtt('NatPublicIPA', 'AllocationId'),
                SubnetId: cf.ref('SubnetPublicA'),
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-a'])
                }]
            }
        },
        NatGatewayB: {
            Type: 'AWS::EC2::NatGateway',
            Condition: 'CreateProdResources',
            Properties:  {
                AllocationId: cf.getAtt('NatPublicIPB', 'AllocationId'),
                SubnetId: cf.ref('SubnetPublicB'),
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-b'])
                }]
            }
        },
        NatPublicIPA: {
            Type: 'AWS::EC2::EIP',
            DependsOn: 'VPC',
            Properties: {
                Domain: 'vpc',
                Tags: [{
                    Key: 'Name',
                    Value: cf.stackName
                }]
            }
        },
        NatPublicIPB: {
            Type: 'AWS::EC2::EIP',
            Condition: 'CreateProdResources',
            DependsOn: 'VPC',
            Properties: {
                Domain: 'vpc',
                Tags: [{
                    Key: 'Name',
                    Value: cf.stackName
                }]
            }
        },
        PrivateRouteTableA: {
            Type: 'AWS::EC2::RouteTable',
            Properties: {
                VpcId: cf.ref('VPC'),
                Tags: [{
                    Key: 'Network',
                    Value: 'Private'
                },{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-private-subnet-a'])
                }]
            }
        },
        PrivateRouteTableB: {
            Type: 'AWS::EC2::RouteTable',
            Properties: {
                VpcId: cf.ref('VPC'),
                Tags: [{
                    Key: 'Network',
                    Value: 'Private'
                },{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-private-subnet-b'])
                }]
            }
        },
        PrivateRouteA: {
            Type: 'AWS::EC2::Route',
            DependsOn:  'VPCIG',
            Properties: {
                RouteTableId: cf.ref('PrivateRouteTableA'),
                DestinationCidrBlock: '0.0.0.0/0',
                NatGatewayId: cf.ref('NatGatewayA')
            }
        },
        PrivateRouteB: {
            Type: 'AWS::EC2::Route',
            DependsOn:  'VPCIG',
            Properties: {
                RouteTableId: cf.ref('PrivateRouteTableB'),
                DestinationCidrBlock: '0.0.0.0/0',
                NatGatewayId: cf.if('CreateProdResources', cf.ref('NatGatewayB'), cf.ref('NatGatewayA'))
            }
        },
        PrivateRouteV6A: {
            Type: 'AWS::EC2::Route',
            Properties: {
                RouteTableId: cf.ref('PrivateRouteTableA'),
                DestinationIpv6CidrBlock: '::/0',
                GatewayId: cf.ref('EgressOnlyInternetGateway')
            }
        },
        PrivateRouteV6B: {
            Type: 'AWS::EC2::Route',
            Properties: {
                RouteTableId: cf.ref('PrivateRouteTableB'),
                DestinationIpv6CidrBlock: '::/0',
                GatewayId: cf.ref('EgressOnlyInternetGateway')
            }
        },
        SubnetPrivateAAssoc: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
                RouteTableId: cf.ref('PrivateRouteTableA'),
                SubnetId: cf.ref('SubnetPrivateA')
            }
        },
        SubnetPrivateBAssoc: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
                RouteTableId: cf.ref('PrivateRouteTableB'),
                SubnetId: cf.ref('SubnetPrivateB')
            }
        }
    },
    Conditions: {
        CreateProdResources: cf.equals(cf.ref('EnvType'), 'prod')
    },
    Outputs: {
        VPC: {
            Description: 'VPC ID',
            Export: {
                Name: cf.join([cf.stackName, '-vpc'])
            },
            Value: cf.ref('VPC')
        },
        VPCCIDR: {
            Description: 'VPC CIDR Block',
            Export: {
                Name: cf.join([cf.stackName, '-vpc-cidr'])
            },
            Value: cf.getAtt('VPC', 'CidrBlock')
        },
        SubnetPublicA: {
            Description: 'Subnet Public A',
            Export: {
                Name: cf.join([cf.stackName, '-subnet-public-a'])
            },
            Value: cf.ref('SubnetPublicA')
        },
        SubnetPublicB: {
            Description: 'Subnet Public B',
            Export: {
                Name: cf.join([cf.stackName, '-subnet-public-b'])
            },
            Value: cf.ref('SubnetPublicB')
        },
        SubnetPrivateA: {
            Description: 'Subnet Private A',
            Export: {
                Name: cf.join([cf.stackName, '-subnet-private-a'])
            },
            Value: cf.ref('SubnetPrivateA')
        },
        SubnetPrivateB: {
            Description: 'Subnet Private B',
            Export: {
                Name: cf.join([cf.stackName, '-subnet-private-b'])
            },
            Value: cf.ref('SubnetPrivateB')
        },
        GitSha: {
            Export: {
                Name: cf.join([cf.stackName, '-gitsha'])
            },
            Value: cf.ref('GitSha')
        }
    }
};
