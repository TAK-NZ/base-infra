import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        InstanceConnectSubnetPublicA: {
            Type: 'AWS::EC2::InstanceConnectEndpoint',
            Properties: {
                SecurityGroupIds: [cf.ref('InstanceConnectSG')],
                SubnetId: cf.ref('SubnetPublicA')
            }
        },
        InstanceConnectSG: {
            Type : 'AWS::EC2::SecurityGroup',
            Properties : {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join('-', [cf.stackName, 'instance-connect-sg'])
                }],
                GroupName: cf.join('-', [cf.stackName, 'instance-connect-sg']),
                GroupDescription: 'Instance Connect SG',
                VpcId: cf.ref('VPC')
            }

        }
    },
    Outputs: {
        InstanceConnect: {
            Description: 'Instance Connect Public Subnet A SG',
            Export: {
                Name: cf.join([cf.stackName, '-connect-public-a-sg'])
            },
            Value: cf.ref('InstanceConnectSG')
        }
    }
};
