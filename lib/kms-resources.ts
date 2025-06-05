import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';

export function createKmsResources(scope: Construct, stackName: string) {
  const kmsKey = new kms.CfnKey(scope, 'KMS', {
    description: stackName,
    enabled: true,
    enableKeyRotation: false,
    keyPolicy: {
      Id: stackName,
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }
          },
          Action: 'kms:*',
          Resource: '*',
        },
      ],
    },
  });
  const kmsAlias = new kms.CfnAlias(scope, 'KMSAlias', {
    aliasName: `alias/${stackName}`,
    targetKeyId: kmsKey.ref,
  });
  return { kmsKey, kmsAlias };
}
