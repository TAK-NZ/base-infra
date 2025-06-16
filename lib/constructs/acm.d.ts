import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface AcmCertificateProps {
    zoneName: string;
    certificateTransparency?: boolean;
}
export declare function createAcmCertificate(scope: Construct, props: AcmCertificateProps): {
    certificate: cdk.aws_certificatemanager.Certificate;
    hostedZone: cdk.aws_route53.IHostedZone;
};
