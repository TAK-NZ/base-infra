import { Construct } from 'constructs';
import { Vpc, SubnetType, SecurityGroup, GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService, GatewayVpcEndpoint, InterfaceVpcEndpoint, IVpc, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';

export function createVpcEndpoints(scope: Construct, params: {
  vpc: IVpc;
  privateSubnets: string[]; // subnet IDs or SubnetSelection
  endpointSg?: ISecurityGroup;
  stackName: string;
  createVpcEndpoints: boolean;
}) {
  const endpoints: Record<string, GatewayVpcEndpoint | InterfaceVpcEndpoint> = {};
  
  // S3 Gateway Endpoint (always created)
  endpoints.s3 = params.vpc.addGatewayEndpoint('S3Endpoint', {
    service: GatewayVpcEndpointAwsService.S3,
    subnets: [{ subnets: params.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }).subnets }],
  });
  
  // Interface Endpoints (created based on createVpcEndpoints parameter)
  if (params.createVpcEndpoints) {
    const interfaceServices = [
      { id: 'ECRDKREndpoint', service: InterfaceVpcEndpointAwsService.ECR_DOCKER, name: 'ecr-dkr-interface' },
      { id: 'ECRAPIEndpoint', service: InterfaceVpcEndpointAwsService.ECR, name: 'ecr-api-interface' },
      { id: 'KMSEndpoint', service: InterfaceVpcEndpointAwsService.KMS, name: 'kms-interface' },
      { id: 'SecretsManagerEndpoint', service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER, name: 'secretsmanager-interface' },
      { id: 'CloudwatchEndpoint', service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, name: 'cloudwatch-interface' },
    ];
    
    for (const ep of interfaceServices) {
      endpoints[ep.id] = params.vpc.addInterfaceEndpoint(ep.id, {
        service: ep.service,
        subnets: { subnets: params.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }).subnets },
        securityGroups: params.endpointSg ? [params.endpointSg] : undefined,
        privateDnsEnabled: true,
      });
    }
  }
  
  return endpoints;
}
