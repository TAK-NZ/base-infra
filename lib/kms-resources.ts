import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { PolicyStatement, Effect, AccountRootPrincipal } from 'aws-cdk-lib/aws-iam';

export function createKmsResources(scope: Construct, stackName: string) {
  // Create L2 KMS Key
  const kmsKey = new kms.Key(scope, 'KMS', {
    description: stackName,
    enableKeyRotation: false,
    removalPolicy: undefined, // Set as needed
  });

  // Add root account full access (explicit for clarity)
  kmsKey.addToResourcePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    principals: [new AccountRootPrincipal()],
    actions: ['kms:*'],
    resources: ['*'],
  }));

  // Create L2 Alias
  const kmsAlias = new kms.Alias(scope, 'KMSAlias', {
    aliasName: `alias/${stackName}`,
    targetKey: kmsKey,
  });

  return { kmsKey, kmsAlias };
}
