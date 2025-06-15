"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVpcL2Resources = createVpcL2Resources;
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
/**
 * Creates a VPC using L2 constructs with IPv6 support.
 *
 * Uses a hybrid approach:
 * - L2 VPC construct (ec2.Vpc) for standard VPC setup and best practices
 * - L1 constructs (CfnVPCCidrBlock, CfnEgressOnlyInternetGateway) for IPv6 support
 *   since the L2 VPC construct doesn't natively support IPv6
 *
 * @returns Object containing the VPC, IPv6 CIDR block, and VPC logical ID for use in outputs
 */
function createVpcL2Resources(scope, vpcMajorId, vpcMinorId, createNatGateways) {
    const vpc = new ec2.Vpc(scope, 'Vpc', {
        ipAddresses: ec2.IpAddresses.cidr(`10.${vpcMajorId}.0.0/16`),
        maxAzs: 2,
        natGateways: createNatGateways ? 2 : 1, // 1 NAT Gateway always, 2 for redundancy
        subnetConfiguration: [
            {
                cidrMask: 24,
                name: 'public',
                subnetType: ec2.SubnetType.PUBLIC,
                mapPublicIpOnLaunch: true,
            },
            {
                cidrMask: 24,
                name: 'private',
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
        ],
    });
    // Add IPv6 support to the VPC
    const ipv6CidrBlock = new ec2.CfnVPCCidrBlock(scope, 'VpcIpv6CidrBlock', {
        vpcId: vpc.vpcId,
        amazonProvidedIpv6CidrBlock: true,
    });
    // Enable IPv6 on all subnets using CloudFormation intrinsic functions
    const vpcLogicalId = vpc.node.defaultChild.logicalId;
    vpc.publicSubnets.forEach((subnet, index) => {
        const cfnSubnet = subnet.node.defaultChild;
        // Use the VPC's Ipv6CidrBlocks attribute instead of the VPCCidrBlock's Ipv6CidrBlock
        cfnSubnet.ipv6CidrBlock = {
            "Fn::Select": [
                index,
                {
                    "Fn::Cidr": [
                        {
                            "Fn::Select": [
                                0,
                                {
                                    "Fn::GetAtt": [
                                        vpcLogicalId,
                                        "Ipv6CidrBlocks"
                                    ]
                                }
                            ]
                        },
                        256,
                        64
                    ]
                }
            ]
        };
        cfnSubnet.assignIpv6AddressOnCreation = true;
        cfnSubnet.addDependency(ipv6CidrBlock);
    });
    vpc.privateSubnets.forEach((subnet, index) => {
        const cfnSubnet = subnet.node.defaultChild;
        // Use the VPC's Ipv6CidrBlocks attribute instead of the VPCCidrBlock's Ipv6CidrBlock
        cfnSubnet.ipv6CidrBlock = {
            "Fn::Select": [
                index + vpc.publicSubnets.length,
                {
                    "Fn::Cidr": [
                        {
                            "Fn::Select": [
                                0,
                                {
                                    "Fn::GetAtt": [
                                        vpcLogicalId,
                                        "Ipv6CidrBlocks"
                                    ]
                                }
                            ]
                        },
                        256,
                        64
                    ]
                }
            ]
        };
        cfnSubnet.assignIpv6AddressOnCreation = true;
        cfnSubnet.addDependency(ipv6CidrBlock);
    });
    // Add Egress-Only Internet Gateway for private subnets IPv6 traffic
    const egressOnlyIgw = new ec2.CfnEgressOnlyInternetGateway(scope, 'EgressOnlyIgw', {
        vpcId: vpc.vpcId,
    });
    // Add IPv6 routes for private subnets to use Egress-Only Internet Gateway
    // Since L2 VPC construct doesn't provide direct access to individual route tables,
    // we'll add the routes by iterating through isolated subnets and finding their route tables
    vpc.isolatedSubnets.concat(vpc.privateSubnets).forEach((subnet, index) => {
        // Only process private subnets (skip isolated if any)
        if (vpc.privateSubnets.includes(subnet)) {
            const privateIndex = vpc.privateSubnets.indexOf(subnet);
            // Create the IPv6 route using the subnet's route table ID
            // We'll use a more direct approach with CloudFormation
            new ec2.CfnRoute(scope, `PrivateIpv6Route${privateIndex}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationIpv6CidrBlock: '::/0',
                egressOnlyInternetGatewayId: egressOnlyIgw.ref,
            });
        }
    });
    // The L2 VPC construct automatically handles IPv4 routing and IPv6 routing for public subnets
    // but we need to manually add IPv6 egress routes for private subnets
    return { vpc, ipv6CidrBlock, vpcLogicalId };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjQSxvREFrSEM7QUEvSEQseURBQTJDO0FBRzNDOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLG9CQUFvQixDQUFDLEtBQWdCLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUFFLGlCQUEwQjtJQUN2SCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtRQUNwQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxVQUFVLFNBQVMsQ0FBQztRQUM1RCxNQUFNLEVBQUUsQ0FBQztRQUNULFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUseUNBQXlDO1FBQ2pGLG1CQUFtQixFQUFFO1lBQ25CO2dCQUNFLFFBQVEsRUFBRSxFQUFFO2dCQUNaLElBQUksRUFBRSxRQUFRO2dCQUNkLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07Z0JBQ2pDLG1CQUFtQixFQUFFLElBQUk7YUFDMUI7WUFDRDtnQkFDRSxRQUFRLEVBQUUsRUFBRTtnQkFDWixJQUFJLEVBQUUsU0FBUztnQkFDZixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7YUFDL0M7U0FDRjtLQUNGLENBQUMsQ0FBQztJQUVILDhCQUE4QjtJQUM5QixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO1FBQ3ZFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztRQUNoQiwyQkFBMkIsRUFBRSxJQUFJO0tBQ2xDLENBQUMsQ0FBQztJQUVILHNFQUFzRTtJQUN0RSxNQUFNLFlBQVksR0FBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQTJCLENBQUMsU0FBUyxDQUFDO0lBRXJFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQzFDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBNkIsQ0FBQztRQUM1RCxxRkFBcUY7UUFDckYsU0FBUyxDQUFDLGFBQWEsR0FBRztZQUN4QixZQUFZLEVBQUU7Z0JBQ1osS0FBSztnQkFDTDtvQkFDRSxVQUFVLEVBQUU7d0JBQ1Y7NEJBQ0UsWUFBWSxFQUFFO2dDQUNaLENBQUM7Z0NBQ0Q7b0NBQ0UsWUFBWSxFQUFFO3dDQUNaLFlBQVk7d0NBQ1osZ0JBQWdCO3FDQUNqQjtpQ0FDRjs2QkFDRjt5QkFDRjt3QkFDRCxHQUFHO3dCQUNILEVBQUU7cUJBQ0g7aUJBQ0Y7YUFDRjtTQUNLLENBQUM7UUFDVCxTQUFTLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7SUFFSCxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUMzQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQTZCLENBQUM7UUFDNUQscUZBQXFGO1FBQ3JGLFNBQVMsQ0FBQyxhQUFhLEdBQUc7WUFDeEIsWUFBWSxFQUFFO2dCQUNaLEtBQUssR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQ2hDO29CQUNFLFVBQVUsRUFBRTt3QkFDVjs0QkFDRSxZQUFZLEVBQUU7Z0NBQ1osQ0FBQztnQ0FDRDtvQ0FDRSxZQUFZLEVBQUU7d0NBQ1osWUFBWTt3Q0FDWixnQkFBZ0I7cUNBQ2pCO2lDQUNGOzZCQUNGO3lCQUNGO3dCQUNELEdBQUc7d0JBQ0gsRUFBRTtxQkFDSDtpQkFDRjthQUNGO1NBQ0ssQ0FBQztRQUNULFNBQVMsQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7UUFDN0MsU0FBUyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsQ0FBQztJQUVILG9FQUFvRTtJQUNwRSxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFO1FBQ2pGLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztLQUNqQixDQUFDLENBQUM7SUFFSCwwRUFBMEU7SUFDMUUsbUZBQW1GO0lBQ25GLDRGQUE0RjtJQUM1RixHQUFHLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ3ZFLHNEQUFzRDtRQUN0RCxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDeEMsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFeEQsMERBQTBEO1lBQzFELHVEQUF1RDtZQUN2RCxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLG1CQUFtQixZQUFZLEVBQUUsRUFBRTtnQkFDekQsWUFBWSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWTtnQkFDNUMsd0JBQXdCLEVBQUUsTUFBTTtnQkFDaEMsMkJBQTJCLEVBQUUsYUFBYSxDQUFDLEdBQUc7YUFDL0MsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsOEZBQThGO0lBQzlGLHFFQUFxRTtJQUVyRSxPQUFPLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBWUEMgdXNpbmcgTDIgY29uc3RydWN0cyB3aXRoIElQdjYgc3VwcG9ydC5cbiAqIFxuICogVXNlcyBhIGh5YnJpZCBhcHByb2FjaDpcbiAqIC0gTDIgVlBDIGNvbnN0cnVjdCAoZWMyLlZwYykgZm9yIHN0YW5kYXJkIFZQQyBzZXR1cCBhbmQgYmVzdCBwcmFjdGljZXNcbiAqIC0gTDEgY29uc3RydWN0cyAoQ2ZuVlBDQ2lkckJsb2NrLCBDZm5FZ3Jlc3NPbmx5SW50ZXJuZXRHYXRld2F5KSBmb3IgSVB2NiBzdXBwb3J0XG4gKiAgIHNpbmNlIHRoZSBMMiBWUEMgY29uc3RydWN0IGRvZXNuJ3QgbmF0aXZlbHkgc3VwcG9ydCBJUHY2XG4gKiBcbiAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIHRoZSBWUEMsIElQdjYgQ0lEUiBibG9jaywgYW5kIFZQQyBsb2dpY2FsIElEIGZvciB1c2UgaW4gb3V0cHV0c1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVnBjTDJSZXNvdXJjZXMoc2NvcGU6IENvbnN0cnVjdCwgdnBjTWFqb3JJZDogbnVtYmVyLCB2cGNNaW5vcklkOiBudW1iZXIsIGNyZWF0ZU5hdEdhdGV3YXlzOiBib29sZWFuKTogeyB2cGM6IGVjMi5WcGM7IGlwdjZDaWRyQmxvY2s6IGVjMi5DZm5WUENDaWRyQmxvY2s7IHZwY0xvZ2ljYWxJZDogc3RyaW5nIH0ge1xuICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyhzY29wZSwgJ1ZwYycsIHtcbiAgICBpcEFkZHJlc3NlczogZWMyLklwQWRkcmVzc2VzLmNpZHIoYDEwLiR7dnBjTWFqb3JJZH0uMC4wLzE2YCksXG4gICAgbWF4QXpzOiAyLFxuICAgIG5hdEdhdGV3YXlzOiBjcmVhdGVOYXRHYXRld2F5cyA/IDIgOiAxLCAvLyAxIE5BVCBHYXRld2F5IGFsd2F5cywgMiBmb3IgcmVkdW5kYW5jeVxuICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgIHtcbiAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICBuYW1lOiAncHVibGljJyxcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICBuYW1lOiAncHJpdmF0ZScsXG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICB9LFxuICAgIF0sXG4gIH0pO1xuXG4gIC8vIEFkZCBJUHY2IHN1cHBvcnQgdG8gdGhlIFZQQ1xuICBjb25zdCBpcHY2Q2lkckJsb2NrID0gbmV3IGVjMi5DZm5WUENDaWRyQmxvY2soc2NvcGUsICdWcGNJcHY2Q2lkckJsb2NrJywge1xuICAgIHZwY0lkOiB2cGMudnBjSWQsXG4gICAgYW1hem9uUHJvdmlkZWRJcHY2Q2lkckJsb2NrOiB0cnVlLFxuICB9KTtcblxuICAvLyBFbmFibGUgSVB2NiBvbiBhbGwgc3VibmV0cyB1c2luZyBDbG91ZEZvcm1hdGlvbiBpbnRyaW5zaWMgZnVuY3Rpb25zXG4gIGNvbnN0IHZwY0xvZ2ljYWxJZCA9ICh2cGMubm9kZS5kZWZhdWx0Q2hpbGQgYXMgZWMyLkNmblZQQykubG9naWNhbElkO1xuICBcbiAgdnBjLnB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IGNmblN1Ym5ldCA9IHN1Ym5ldC5ub2RlLmRlZmF1bHRDaGlsZCBhcyBlYzIuQ2ZuU3VibmV0O1xuICAgIC8vIFVzZSB0aGUgVlBDJ3MgSXB2NkNpZHJCbG9ja3MgYXR0cmlidXRlIGluc3RlYWQgb2YgdGhlIFZQQ0NpZHJCbG9jaydzIElwdjZDaWRyQmxvY2tcbiAgICBjZm5TdWJuZXQuaXB2NkNpZHJCbG9jayA9IHtcbiAgICAgIFwiRm46OlNlbGVjdFwiOiBbXG4gICAgICAgIGluZGV4LFxuICAgICAgICB7XG4gICAgICAgICAgXCJGbjo6Q2lkclwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiRm46OlNlbGVjdFwiOiBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBcIkZuOjpHZXRBdHRcIjogW1xuICAgICAgICAgICAgICAgICAgICB2cGNMb2dpY2FsSWQsXG4gICAgICAgICAgICAgICAgICAgIFwiSXB2NkNpZHJCbG9ja3NcIlxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIDI1NixcbiAgICAgICAgICAgIDY0XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSBhcyBhbnk7XG4gICAgY2ZuU3VibmV0LmFzc2lnbklwdjZBZGRyZXNzT25DcmVhdGlvbiA9IHRydWU7XG4gICAgY2ZuU3VibmV0LmFkZERlcGVuZGVuY3koaXB2NkNpZHJCbG9jayk7XG4gIH0pO1xuXG4gIHZwYy5wcml2YXRlU3VibmV0cy5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgY2ZuU3VibmV0ID0gc3VibmV0Lm5vZGUuZGVmYXVsdENoaWxkIGFzIGVjMi5DZm5TdWJuZXQ7XG4gICAgLy8gVXNlIHRoZSBWUEMncyBJcHY2Q2lkckJsb2NrcyBhdHRyaWJ1dGUgaW5zdGVhZCBvZiB0aGUgVlBDQ2lkckJsb2NrJ3MgSXB2NkNpZHJCbG9ja1xuICAgIGNmblN1Ym5ldC5pcHY2Q2lkckJsb2NrID0ge1xuICAgICAgXCJGbjo6U2VsZWN0XCI6IFtcbiAgICAgICAgaW5kZXggKyB2cGMucHVibGljU3VibmV0cy5sZW5ndGgsXG4gICAgICAgIHtcbiAgICAgICAgICBcIkZuOjpDaWRyXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJGbjo6U2VsZWN0XCI6IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFwiRm46OkdldEF0dFwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHZwY0xvZ2ljYWxJZCxcbiAgICAgICAgICAgICAgICAgICAgXCJJcHY2Q2lkckJsb2Nrc1wiXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgMjU2LFxuICAgICAgICAgICAgNjRcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9IGFzIGFueTtcbiAgICBjZm5TdWJuZXQuYXNzaWduSXB2NkFkZHJlc3NPbkNyZWF0aW9uID0gdHJ1ZTtcbiAgICBjZm5TdWJuZXQuYWRkRGVwZW5kZW5jeShpcHY2Q2lkckJsb2NrKTtcbiAgfSk7XG5cbiAgLy8gQWRkIEVncmVzcy1Pbmx5IEludGVybmV0IEdhdGV3YXkgZm9yIHByaXZhdGUgc3VibmV0cyBJUHY2IHRyYWZmaWNcbiAgY29uc3QgZWdyZXNzT25seUlndyA9IG5ldyBlYzIuQ2ZuRWdyZXNzT25seUludGVybmV0R2F0ZXdheShzY29wZSwgJ0VncmVzc09ubHlJZ3cnLCB7XG4gICAgdnBjSWQ6IHZwYy52cGNJZCxcbiAgfSk7XG5cbiAgLy8gQWRkIElQdjYgcm91dGVzIGZvciBwcml2YXRlIHN1Ym5ldHMgdG8gdXNlIEVncmVzcy1Pbmx5IEludGVybmV0IEdhdGV3YXlcbiAgLy8gU2luY2UgTDIgVlBDIGNvbnN0cnVjdCBkb2Vzbid0IHByb3ZpZGUgZGlyZWN0IGFjY2VzcyB0byBpbmRpdmlkdWFsIHJvdXRlIHRhYmxlcyxcbiAgLy8gd2UnbGwgYWRkIHRoZSByb3V0ZXMgYnkgaXRlcmF0aW5nIHRocm91Z2ggaXNvbGF0ZWQgc3VibmV0cyBhbmQgZmluZGluZyB0aGVpciByb3V0ZSB0YWJsZXNcbiAgdnBjLmlzb2xhdGVkU3VibmV0cy5jb25jYXQodnBjLnByaXZhdGVTdWJuZXRzKS5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgLy8gT25seSBwcm9jZXNzIHByaXZhdGUgc3VibmV0cyAoc2tpcCBpc29sYXRlZCBpZiBhbnkpXG4gICAgaWYgKHZwYy5wcml2YXRlU3VibmV0cy5pbmNsdWRlcyhzdWJuZXQpKSB7XG4gICAgICBjb25zdCBwcml2YXRlSW5kZXggPSB2cGMucHJpdmF0ZVN1Ym5ldHMuaW5kZXhPZihzdWJuZXQpO1xuICAgICAgXG4gICAgICAvLyBDcmVhdGUgdGhlIElQdjYgcm91dGUgdXNpbmcgdGhlIHN1Ym5ldCdzIHJvdXRlIHRhYmxlIElEXG4gICAgICAvLyBXZSdsbCB1c2UgYSBtb3JlIGRpcmVjdCBhcHByb2FjaCB3aXRoIENsb3VkRm9ybWF0aW9uXG4gICAgICBuZXcgZWMyLkNmblJvdXRlKHNjb3BlLCBgUHJpdmF0ZUlwdjZSb3V0ZSR7cHJpdmF0ZUluZGV4fWAsIHtcbiAgICAgICAgcm91dGVUYWJsZUlkOiBzdWJuZXQucm91dGVUYWJsZS5yb3V0ZVRhYmxlSWQsXG4gICAgICAgIGRlc3RpbmF0aW9uSXB2NkNpZHJCbG9jazogJzo6LzAnLFxuICAgICAgICBlZ3Jlc3NPbmx5SW50ZXJuZXRHYXRld2F5SWQ6IGVncmVzc09ubHlJZ3cucmVmLFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBUaGUgTDIgVlBDIGNvbnN0cnVjdCBhdXRvbWF0aWNhbGx5IGhhbmRsZXMgSVB2NCByb3V0aW5nIGFuZCBJUHY2IHJvdXRpbmcgZm9yIHB1YmxpYyBzdWJuZXRzXG4gIC8vIGJ1dCB3ZSBuZWVkIHRvIG1hbnVhbGx5IGFkZCBJUHY2IGVncmVzcyByb3V0ZXMgZm9yIHByaXZhdGUgc3VibmV0c1xuXG4gIHJldHVybiB7IHZwYywgaXB2NkNpZHJCbG9jaywgdnBjTG9naWNhbElkIH07XG59XG4iXX0=