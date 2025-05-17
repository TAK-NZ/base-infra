import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
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
        ConfigBucketArn: {
            Description: 'S3 Config Bucket ARN',
            Export: {
                Name: cf.join([cf.stackName, '-s3'])
            },
            Value: cf.getAtt('ConfigBucket', 'Arn')
        }
    }
};
