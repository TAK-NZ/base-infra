import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        KMSAlias: {
            Type: 'AWS::KMS::Alias',
            Properties: {
                AliasName: cf.join(['alias/', cf.stackName]),
                TargetKeyId: cf.ref('KMS')
            }
        },
        KMS: {
            Type : 'AWS::KMS::Key',
            Properties: {
                Description: cf.stackName,
                Enabled: true,
                EnableKeyRotation: false,
                KeyPolicy: {
                    Id: cf.stackName,
                    Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            AWS: cf.join(['arn:', cf.partition, ':iam::', cf.accountId, ':root'])
                        },
                        Action: ['kms:*'],
                        Resource: '*'
                    }]
                }
            }
        },
        ConfigBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
                BucketName: cf.join([cf.stackName, '-', cf.region, '-env-config']),
                OwnershipControls: {
                    Rules: [{
                        ObjectOwnership: 'BucketOwnerEnforced'
                    }]
                },
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [{
                        ServerSideEncryptionByDefault: {
                            KMSMasterKeyID: cf.ref('KMSAlias'),
                            SSEAlgorithm: 'aws:kms'
                        },
                        BucketKeyEnabled: true
                    }]
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true
                }
            },
            DeletionPolicy: 'Delete'
        }
    },
    Outputs: {
        KMS: {
            Description: 'KMS',
            Export: {
                Name: cf.join([cf.stackName, '-kms'])
            },
            Value: cf.getAtt('KMS', 'Arn')
        },
        ConfigBucket: {
            Description: 'Bucket ARN',
            Export: {
                Name: cf.join([cf.stackName, '-s3'])
            },
            Value: cf.getAtt('ConfigBucket', 'Arn')
        }
    }
};
