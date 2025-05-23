import cf from '@openaddresses/cloudfriend';
import VPC from './lib/vpc.js';
import ECS from './lib/ecs.js';
import ECR from './lib/ecr.js';
import KMS from './lib/kms.js';
import S3 from './lib/s3.js';
import endpoints from './lib/endpoints.js';

export default cf.merge(
    VPC,
    ECS,
    ECR,
    KMS,
    S3,
    endpoints,
    {
        Description: 'TAK Base Layer - VPC, ECS, ECR, KMS, S3',
        Parameters: {
            EnvType: {
                Description: 'Environment type',
                Type: 'String',
                AllowedValues: ['prod', 'dev-test'],
                Default: 'prod'
            }
        }
    }
);
