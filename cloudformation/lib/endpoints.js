import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        S3Endpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Properties: {
                VpcEndpointType: 'Gateway',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-s3-gateway'])
                }],
                RouteTableIds: [
                    cf.ref('PrivateRouteTableA'),
                    cf.ref('PrivateRouteTableB')
                ],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.s3']),
                VpcId: cf.ref('VPC')
            }
        },
        ECRDKREndpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Condition: 'CreateProdResources',
            Properties: {
                VpcEndpointType: 'Interface',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-ecr-dkr-interface'])
                }],
                SubnetIds: [
                    cf.ref('SubnetPrivateA'),
                    cf.ref('SubnetPrivateB')
                ],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.ecr.dkr']),
                VpcId: cf.ref('VPC'),
                PrivateDnsEnabled: true,
                SecurityGroupIds: [
                    cf.ref('EndpointSecurityGroup')
                ]
            }
        },
        ECRAPIEndpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Condition: 'CreateProdResources',
            Properties: {
                VpcEndpointType: 'Interface',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-ecr-api-interface'])
                }],
                SubnetIds: [
                    cf.ref('SubnetPrivateA'),
                    cf.ref('SubnetPrivateB')
                ],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.ecr.api']),
                VpcId: cf.ref('VPC'),
                PrivateDnsEnabled: true,
                SecurityGroupIds: [
                    cf.ref('EndpointSecurityGroup')
                ]
            }
        },
        KMSEndpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Condition: 'CreateProdResources',
            Properties: {
                VpcEndpointType: 'Interface',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-kms-interface'])
                }],
                SubnetIds: [
                    cf.ref('SubnetPrivateA'),
                    cf.ref('SubnetPrivateB')
                ],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.kms']),
                VpcId: cf.ref('VPC'),
                PrivateDnsEnabled: true,
                SecurityGroupIds: [
                    cf.ref('EndpointSecurityGroup')
                ]
            }
        },
        SecretsManagerEndpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Condition: 'CreateProdResources',
            Properties: {
                VpcEndpointType: 'Interface',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-secretsmanager-interface'])
                }],
                SubnetIds: [
                    cf.ref('SubnetPrivateA'),
                    cf.ref('SubnetPrivateB')
                ],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.secretsmanager']),
                VpcId: cf.ref('VPC'),
                PrivateDnsEnabled: true,
                SecurityGroupIds: [
                    cf.ref('EndpointSecurityGroup')
                ]
            }
        },
        CloudwatchEndpoint: {
            Type: 'AWS::EC2::VPCEndpoint',
            Condition: 'CreateProdResources',
            Properties: {
                VpcEndpointType: 'Interface',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-cloudwatch-interface'])
                }],
                SubnetIds: [
                    cf.ref('SubnetPrivateA'),
                    cf.ref('SubnetPrivateB')
                ],
                ServiceName: cf.join(['com.amazonaws.', cf.region, '.logs']),
                VpcId: cf.ref('VPC'),
                PrivateDnsEnabled: true,
                SecurityGroupIds: [
                    cf.ref('EndpointSecurityGroup')
                ]
            }
        },
        EndpointSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Condition: 'CreateProdResources',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'endpoint-sg'])
                }],
                GroupName: cf.join('-', [cf.stackName, 'endpoint-sg']),
                GroupDescription: 'Access to Endpoint services',
                SecurityGroupIngress: [{
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443,
                    CidrIp: cf.getAtt('VPC', 'CidrBlock')
                }],
                VpcId: cf.ref('VPC')
            }
        }
    }
};
