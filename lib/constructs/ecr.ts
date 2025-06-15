import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';

export function createEcrResources(scope: Construct, stackName: string) {
  const repoName = stackName.toLowerCase().replace(/[^a-z0-9\-_.]/g, '-').replace(/^-+|-+$/g, '');

  // Create the ECR repository
  const ecrRepo = new ecr.Repository(scope, 'Repository', {
    repositoryName: repoName,
    lifecycleRules: [
      {
        description: 'Expire untagged images older than 1 day',
        rulePriority: 1,
        tagStatus: ecr.TagStatus.UNTAGGED,
        maxImageAge: cdk.Duration.days(1),
      },
      {
        description: 'Keep only the last 5 versions of tagged images',
        rulePriority: 2,
        tagStatus: ecr.TagStatus.TAGGED,
        tagPatternList: ['*'],
        maxImageCount: 5,
      },
    ],
    // ECR will not be retained after stack deletion
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  // Add a resource policy (repository policy)
  ecrRepo.addToResourcePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [new iam.AnyPrincipal()],
    actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
  }));

  return { ecrRepo };
}