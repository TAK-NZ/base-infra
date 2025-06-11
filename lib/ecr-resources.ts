import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export function createEcrResources(scope: Construct, stackName: string) {
  // ECR repository names must be lowercase and follow specific naming rules
  // Only allow lowercase letters, numbers, hyphens, underscores, and periods
  const repoName = stackName.toLowerCase().replace(/[^a-z0-9\-_.]/g, '-').replace(/^-+|-+$/g, '');
  
  const ecrRepo = new ecr.CfnRepository(scope, 'Repository', {
    repositoryName: repoName,
    repositoryPolicyText: {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
      }],
    },
    lifecyclePolicy: {
      lifecyclePolicyText: '{"rules":[{"rulePriority":1,"description":"Expire untagged images older than 8 days","selection":{"tagStatus":"untagged","countType":"sinceImagePushed","countUnit": "days","countNumber":8},"action":{"type": "expire"}}]}'
    },
  });
  return { ecrRepo };
}
