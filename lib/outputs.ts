import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  vpc: ec2.Vpc;
  ipv6CidrBlock?: ec2.CfnVPCCidrBlock;
  vpcLogicalId?: string;
  ecsCluster: ecs.Cluster;

  kmsKey: kms.Key;
  kmsAlias: kms.Alias;
  configBucket: s3.Bucket;
  vpcEndpoints?: Record<string, ec2.GatewayVpcEndpoint | ec2.InterfaceVpcEndpoint>;
  certificate?: acm.Certificate;
  hostedZone?: route53.IHostedZone;
  masterDashboard?: cloudwatch.Dashboard;
  baseInfraDashboard?: cloudwatch.Dashboard;
  alerting?: any;
  budgetsResources?: any;
}

/**
 * Registers all CloudFormation outputs for the base infrastructure stack
 */
export function registerOutputs(params: OutputParams): void {
  const { stack, stackName } = params;
  
  // Standard outputs
  const outputs = [
    { key: 'VpcId', value: params.vpc.vpcId, description: 'VPC ID' },
    { key: 'VpcCidrIpv4', value: params.vpc.vpcCidrBlock, description: 'VPC IPv4 CIDR Block' },
    { key: 'SubnetPublicA', value: params.vpc.publicSubnets[0].subnetId, description: 'Subnet Public A' },
    { key: 'SubnetPublicB', value: params.vpc.publicSubnets[1].subnetId, description: 'Subnet Public B' },
    { key: 'SubnetPrivateA', value: params.vpc.privateSubnets[0].subnetId, description: 'Subnet Private A' },
    { key: 'SubnetPrivateB', value: params.vpc.privateSubnets[1].subnetId, description: 'Subnet Private B' },
    { key: 'EcsClusterArn', value: params.ecsCluster.clusterArn, description: 'ECS Cluster ARN' },
    { key: 'KmsKeyArn', value: params.kmsKey.keyArn, description: 'KMS Key ARN' },
    { key: 'KmsAlias', value: params.kmsAlias.aliasName, description: 'KMS Key Alias' },
    { key: 'S3BucketArn', value: params.configBucket.bucketArn, description: 'S3 Configuration Bucket ARN' },
  ];

  // Dashboard outputs for cross-stack sharing
  if (params.masterDashboard) {
    outputs.push({
      key: 'MasterDashboardName',
      value: params.masterDashboard.dashboardName,
      description: 'Master Dashboard Name for cross-stack widget additions'
    });
  }

  outputs.forEach(({ key, value, description }) => {
    new cdk.CfnOutput(stack, `${key}Output`, {
      value,
      description,
      exportName: `${stackName}-${key}`,
    });
  });

  // Conditional outputs
  if (params.ipv6CidrBlock && params.vpcLogicalId) {
    new cdk.CfnOutput(stack, 'VpcCidrIpv6Output', {
      value: cdk.Fn.select(0, params.vpc.vpcIpv6CidrBlocks),
      description: 'VPC IPv6 CIDR Block',
      exportName: `${stackName}-VpcCidrIpv6`,
    });
  }

  if (params.certificate) {
    new cdk.CfnOutput(stack, 'CertificateArnOutput', {
      value: params.certificate.certificateArn,
      description: 'ACM Certificate ARN',
      exportName: `${stackName}-CertificateArn`,
    });
  }

  if (params.hostedZone) {
    new cdk.CfnOutput(stack, 'HostedZoneIdOutput', {
      value: params.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${stackName}-HostedZoneId`,
    });
    
    new cdk.CfnOutput(stack, 'HostedZoneNameOutput', {
      value: params.hostedZone.zoneName,
      description: 'Route53 Hosted Zone Name',
      exportName: `${stackName}-HostedZoneName`,
    });
  }

  if (params.baseInfraDashboard) {
    new cdk.CfnOutput(stack, 'BaseInfraDashboardNameOutput', {
      value: params.baseInfraDashboard.dashboardName,
      description: 'BaseInfra Dashboard Name',
      exportName: `${stackName}-BaseInfraDashboardName`,
    });
  }

  if (params.alerting?.criticalAlertsTopic) {
    new cdk.CfnOutput(stack, 'AlertsTopicArnOutput', {
      value: params.alerting.criticalAlertsTopic.topicArn,
      description: 'SNS Topic ARN for Critical Alerts',
      exportName: `${stackName}-AlertsTopicArn`,
    });
  }

  if (params.budgetsResources?.environmentBudget) {
    new cdk.CfnOutput(stack, 'EnvironmentBudgetNameOutput', {
      value: params.budgetsResources.environmentBudget.ref,
      description: 'Environment Budget Name',
      exportName: `${stackName}-EnvironmentBudgetName`,
    });
  }
}
