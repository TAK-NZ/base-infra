import cf from '@openaddresses/cloudfriend';

export default {
    Resources: {
        ECSCluster: {
            Type: 'AWS::ECS::Cluster',
            Properties: {
                ClusterName: cf.stackName,
                CapacityProviders: ['FARGATE'],
                DefaultCapacityProviderStrategy: [{
                    Base: 0,
                    CapacityProvider: 'FARGATE',
                    Weight: 0
                }]
            }
        }
    }
};
