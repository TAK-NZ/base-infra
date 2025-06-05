import { Construct } from 'constructs';
import { CfnVPCEndpoint } from 'aws-cdk-lib/aws-ec2';
import { CfnCondition } from 'aws-cdk-lib';
import { Fn } from 'aws-cdk-lib';

export function createVpcEndpoints(scope: Construct, params: {
  vpcId: string;
  region: string;
  privateRouteTableA: string;
  privateRouteTableB: string;
  subnetPrivateA: string;
  subnetPrivateB: string;
  endpointSgId?: string;
  stackName: string;
  isProdCondition: CfnCondition;
}) {
  const endpoints: Record<string, CfnVPCEndpoint> = {};
  const stackName = Fn.ref('AWS::StackName');
  // S3 Gateway Endpoint (always created)
  endpoints.s3 = new CfnVPCEndpoint(scope, 'S3Endpoint', {
    vpcEndpointType: 'Gateway',
    vpcId: params.vpcId,
    serviceName: `com.amazonaws.${params.region}.s3`,
    routeTableIds: [params.privateRouteTableA, params.privateRouteTableB],
    tags: [{ key: 'Name', value: Fn.join('', [stackName, '-s3-gateway']) }],
  });
  // Interface Endpoints (always present, but only created in prod)
  const endpointSubnets = [params.subnetPrivateA, params.subnetPrivateB];
  const sgIds = params.endpointSgId ? [params.endpointSgId] : [];
  [
    { id: 'ECRDKREndpoint', service: 'ecr.dkr', name: 'ecr-dkr-interface' },
    { id: 'ECRAPIEndpoint', service: 'ecr.api', name: 'ecr-api-interface' },
    { id: 'KMSEndpoint', service: 'kms', name: 'kms-interface' },
    { id: 'SecretsManagerEndpoint', service: 'secretsmanager', name: 'secretsmanager-interface' },
    { id: 'CloudwatchEndpoint', service: 'logs', name: 'cloudwatch-interface' },
  ].forEach(ep => {
    const endpoint = new CfnVPCEndpoint(scope, ep.id, {
      vpcEndpointType: 'Interface',
      vpcId: params.vpcId,
      serviceName: `com.amazonaws.${params.region}.${ep.service}`,
      subnetIds: endpointSubnets,
      privateDnsEnabled: true,
      securityGroupIds: sgIds,
      tags: [{ key: 'Name', value: Fn.join('', [stackName, `-${ep.name}`]) }],
    });
    endpoint.cfnOptions.condition = params.isProdCondition;
    endpoints[ep.id] = endpoint;
  });
  return endpoints;
}
