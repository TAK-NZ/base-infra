import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface AcmCertificateProps {
  zoneName: string;
}

export function createAcmCertificate(scope: Construct, props: AcmCertificateProps) {
  if (!props.zoneName) {
    throw new Error('R53 zone name is required for ACM certificate creation');
  }

  // Look up the existing public hosted zone
  const hostedZone = route53.HostedZone.fromLookup(scope, 'PublicHostedZone', {
    domainName: props.zoneName,
    privateZone: false // Ensure it's a public zone
  });

  // Create ACM certificate with multiple domain names
  const certificate = new acm.Certificate(scope, 'PublicCertificate', {
    domainName: props.zoneName, // e.g., example.com
    subjectAlternativeNames: [
      `*.${props.zoneName}`, // e.g., *.example.com
      `*.map.${props.zoneName}` // e.g., *.map.example.com
    ],
    validation: acm.CertificateValidation.fromDns(hostedZone),
  });

  return { certificate, hostedZone };
}
