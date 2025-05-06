import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        Repository: {
            Type: 'AWS::ECR::Repository',
            Properties: {
                RepositoryName: cf.stackName,
                RepositoryPolicyText: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: '*',
                        Action: [
                            'ecr:BatchGetImage',
                            'ecr:GetDownloadUrlForLayer'
                        ]
                    }]
                },
                LifecyclePolicy: {
                    LifecyclePolicyText: '{"rules":[{"rulePriority":1,"description":"Expire untagged images older than 8 days","selection":{"tagStatus":"untagged","countType":"sinceImagePushed","countUnit": "days","countNumber":8},"action":{"type": "expire"}}]}'
                }
            }
        }
    }
};


