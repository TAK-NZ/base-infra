import cf from '@openaddresses/cloudfriend';
import VPC from './lib/vpc.js';
import ECS from './lib/ecs.js';
import ECR from './lib/ecr.js';
import KMS from './lib/kms.js';
import S3 from './lib/s3.js';

export default cf.merge(
    VPC,
    ECS,
    ECR,
    KMS,
    S3,
    {
        Description: 'TAK Base Layer (VPC, ECR, ECR)',
        Parameters: {
            GitSha: {
                Description: 'GitSha that is currently being deployed',
                Type: 'String'
            },
            EnvType: {
                Description: 'Environment type',
                Type: 'String',
                AllowedValues: ['prod', 'dev-test'],
                Default: 'prod'
            }
        }
    }
);
