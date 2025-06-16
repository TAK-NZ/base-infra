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
    // Add name tag to the Egress-Only Internet Gateway using addOverride
    egressOnlyIgw.addOverride('Properties.Tags', [
        {
            Key: 'Name',
            Value: `${scope.node.id}-EgressOnlyIgw`
        }
    ]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjQSxvREEwSEM7QUF2SUQseURBQTJDO0FBRzNDOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLG9CQUFvQixDQUFDLEtBQWdCLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUFFLGlCQUEwQjtJQUN2SCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtRQUNwQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxVQUFVLFNBQVMsQ0FBQztRQUM1RCxNQUFNLEVBQUUsQ0FBQztRQUNULFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUseUNBQXlDO1FBQ2pGLG1CQUFtQixFQUFFO1lBQ25CO2dCQUNFLFFBQVEsRUFBRSxFQUFFO2dCQUNaLElBQUksRUFBRSxRQUFRO2dCQUNkLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07Z0JBQ2pDLG1CQUFtQixFQUFFLElBQUk7YUFDMUI7WUFDRDtnQkFDRSxRQUFRLEVBQUUsRUFBRTtnQkFDWixJQUFJLEVBQUUsU0FBUztnQkFDZixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7YUFDL0M7U0FDRjtLQUNGLENBQUMsQ0FBQztJQUVILDhCQUE4QjtJQUM5QixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO1FBQ3ZFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztRQUNoQiwyQkFBMkIsRUFBRSxJQUFJO0tBQ2xDLENBQUMsQ0FBQztJQUVILHNFQUFzRTtJQUN0RSxNQUFNLFlBQVksR0FBSSxHQUFHLENBQUMsSUFBSSxD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RSxHQUFHLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZQQyB1c2luZyBMMiBjb25zdHJ1Y3RzIHdpdGggSVB2NiBzdXBwb3J0LlxuICogXG4gKiBVc2VzIGEgaHlicmlkIGFwcHJvYWNoOlxuICogLSBMMiBWUEMgY29uc3RydWN0IChlYzIuVnBjKSBmb3Igc3RhbmRhcmQgVlBDIHNldHVwIGFuZCBiZXN0IHByYWN0aWNlc1xuICogLSBMMSBjb25zdHJ1Y3RzIChDZm5WUENDaWRyQmxvY2ssIENmbkVncmVzc09ubHlJbnRlcm5ldEdhdGV3YXkpIGZvciBJUHY2IHN1cHBvcnRcbiAqICAgc2luY2UgdGhlIEwyIFZQQyBjb25zdHJ1Y3QgZG9lc24ndCBuYXRpdmVseSBzdXBwb3J0IElQdjZcbiAqIFxuICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIFZQQywgSVB2NiBDSURSIGJsb2NrLCBhbmQgVlBDIGxvZ2ljYWwgSUQgZm9yIHVzZSBpbiBvdXRwdXRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWcGNMMlJlc291cmNlcyhzY29wZTogQ29uc3RydWN0LCB2cGNNYWpvcklkOiBudW1iZXIsIHZwY01pbm9ySWQ6IG51bWJlciwgY3JlYXRlTmF0R2F0ZXdheXM6IGJvb2xlYW4pOiB7IHZwYzogZWMyLlZwYzsgaXB2NkNpZHJCbG9jazogZWMyLkNmblZQQ0NpZHJCbG9jazsgdnBjTG9naWNhbElkOiBzdHJpbmcgfSB7XG4gIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHNjb3BlLCAnVnBjJywge1xuICAgIGlwQWRkcmVzc2VzOiBlYzIuSXBBZGRyZXNzZXMuY2lkcihgMTAuJHt2cGNNYWpvcklkfS4wLjAvMTZgKSxcbiAgICBtYXhBenM6IDIsXG4gICAgbmF0R2F0ZXdheXM6IGNyZWF0ZU5hdEdhdGV3YXlzID8gMiA6IDEsIC8vIDEgTkFUIEdhdGV3YXkgYWx3YXlzLCAyIGZvciByZWR1bmRhbmN5XG4gICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAge1xuICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgIG5hbWU6ICdwdWJsaWMnLFxuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgIG5hbWU6ICdwcml2YXRlJyxcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG5cbiAgLy8gQWRkIElQdjYgc3VwcG9ydCB0byB0aGUgVlBDXG4gIGNvbnN0IGlwdjZDaWRyQmxvY2sgPSBuZXcgZWMyLkNmblZQQ0NpZHJCbG9jayhzY29wZSwgJ1ZwY0lwdjZDaWRyQmxvY2snLCB7XG4gICAgdnBjSWQ6IHZwYy52cGNJZCxcbiAgICBhbWF6b25Qcm92aWRlZElwdjZDaWRyQmxvY2s6IHRydWUsXG4gIH0pO1xuXG4gIC8vIEVuYWJsZSBJUHY2IG9uIGFsbCBzdWJuZXRzIHVzaW5nIENsb3VkRm9ybWF0aW9uIGludHJpbnNpYyBmdW5jdGlvbnNcbiAgY29uc3QgdnBjTG9naWNhbElkID0gKHZwYy5ub2RlLmRlZmF1bHRDaGlsZCBhcyBlYzIuQ2ZuVlBDKS5sb2dpY2FsSWQ7XG4gIFxuICB2cGMucHVibGljU3VibmV0cy5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgY2ZuU3VibmV0ID0gc3VibmV0Lm5vZGUuZGVmYXVsdENoaWxkIGFzIGVjMi5DZm5TdWJuZXQ7XG4gICAgLy8gVXNlIHRoZSBWUEMncyBJcHY2Q2lkckJsb2NrcyBhdHRyaWJ1dGUgaW5zdGVhZCBvZiB0aGUgVlBDQ2lkckJsb2NrJ3MgSXB2NkNpZHJCbG9ja1xuICAgIGNmblN1Ym5ldC5pcHY2Q2lkckJsb2NrID0ge1xuICAgICAgXCJGbjo6U2VsZWN0XCI6IFtcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIHtcbiAgICAgICAgICBcIkZuOjpDaWRyXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJGbjo6U2VsZWN0XCI6IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFwiRm46OkdldEF0dFwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHZwY0xvZ2ljYWxJZCxcbiAgICAgICAgICAgICAgICAgICAgXCJJcHY2Q2lkckJsb2Nrc1wiXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgMjU2LFxuICAgICAgICAgICAgNjRcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9IGFzIGFueTtcbiAgICBjZm5TdWJuZXQuYXNzaWduSXB2NkFkZHJlc3NPbkNyZWF0aW9uID0gdHJ1ZTtcbiAgICBjZm5TdWJuZXQuYWRkRGVwZW5kZW5jeShpcHY2Q2lkckJsb2NrKTtcbiAgfSk7XG5cbiAgdnBjLnByaXZhdGVTdWJuZXRzLmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBjZm5TdWJuZXQgPSBzdWJuZXQubm9kZS5kZWZhdWx0Q2hpbGQgYXMgZWMyLkNmblN1Ym5ldDtcbiAgICAvLyBVc2UgdGhlIFZQQydzIElwdjZDaWRyQmxvY2tzIGF0dHJpYnV0ZSBpbnN0ZWFkIG9mIHRoZSBWUENDaWRyQmxvY2sncyBJcHY2Q2lkckJsb2NrXG4gICAgY2ZuU3VibmV0LmlwdjZDaWRyQmxvY2sgPSB7XG4gICAgICBcIkZuOjpTZWxlY3RcIjogW1xuICAgICAgICBpbmRleCArIHZwYy5wdWJsaWNTdWJuZXRzLmxlbmd0aCxcbiAgICAgICAge1xuICAgICAgICAgIFwiRm46OkNpZHJcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIkZuOjpTZWxlY3RcIjogW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgXCJGbjo6R2V0QXR0XCI6IFtcbiAgICAgICAgICAgICAgICAgICAgdnBjTG9naWNhbElkLFxuICAgICAgICAgICAgICAgICAgICBcIklwdjZDaWRyQmxvY2tzXCJcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAyNTYsXG4gICAgICAgICAgICA2NFxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0gYXMgYW55O1xuICAgIGNmblN1Ym5ldC5hc3NpZ25JcHY2QWRkcmVzc09uQ3JlYXRpb24gPSB0cnVlO1xuICAgIGNmblN1Ym5ldC5hZGREZXBlbmRlbmN5KGlwdjZDaWRyQmxvY2spO1xuICB9KTtcblxuICAvLyBBZGQgRWdyZXNzLU9ubHkgSW50ZXJuZXQgR2F0ZXdheSBmb3IgcHJpdmF0ZSBzdWJuZXRzIElQdjYgdHJhZmZpY1xuICBjb25zdCBlZ3Jlc3NPbmx5SWd3ID0gbmV3IGVjMi5DZm5FZ3Jlc3NPbmx5SW50ZXJuZXRHYXRld2F5KHNjb3BlLCAnRWdyZXNzT25seUlndycsIHtcbiAgICB2cGNJZDogdnBjLnZwY0lkLFxuICB9KTtcblxuICAvLyBBZGQgbmFtZSB0YWcgdG8gdGhlIEVncmVzcy1Pbmx5IEludGVybmV0IEdhdGV3YXkgdXNpbmcgYWRkT3ZlcnJpZGVcbiAgZWdyZXNzT25seUlndy5hZGRPdmVycmlkZSgnUHJvcGVydGllcy5UYWdzJywgW1xuICAgIHtcbiAgICAgIEtleTogJ05hbWUnLFxuICAgICAgVmFsdWU6IGAke3Njb3BlLm5vZGUuaWR9LUVncmVzc09ubHlJZ3dgXG4gICAgfVxuICBdKTtcblxuICAvLyBBZGQgSVB2NiByb3V0ZXMgZm9yIHByaXZhdGUgc3VibmV0cyB0byB1c2UgRWdyZXNzLU9ubHkgSW50ZXJuZXQgR2F0ZXdheVxuICAvLyBTaW5jZSBMMiBWUEMgY29uc3RydWN0IGRvZXNuJ3QgcHJvdmlkZSBkaXJlY3QgYWNjZXNzIHRvIGluZGl2aWR1YWwgcm91dGUgdGFibGVzLFxuICAvLyB3ZSdsbCBhZGQgdGhlIHJvdXRlcyBieSBpdGVyYXRpbmcgdGhyb3VnaCBpc29sYXRlZCBzdWJuZXRzIGFuZCBmaW5kaW5nIHRoZWlyIHJvdXRlIHRhYmxlc1xuICB2cGMuaXNvbGF0ZWRTdWJuZXRzLmNvbmNhdCh2cGMucHJpdmF0ZVN1Ym5ldHMpLmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAvLyBPbmx5IHByb2Nlc3MgcHJpdmF0ZSBzdWJuZXRzIChza2lwIGlzb2xhdGVkIGlmIGFueSlcbiAgICBpZiAodnBjLnByaXZhdGVTdWJuZXRzLmluY2x1ZGVzKHN1Ym5ldCkpIHtcbiAgICAgIGNvbnN0IHByaXZhdGVJbmRleCA9IHZwYy5wcml2YXRlU3VibmV0cy5pbmRleE9mKHN1Ym5ldCk7XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgSVB2NiByb3V0ZSB1c2luZyB0aGUgc3VibmV0J3Mgcm91dGUgdGFibGUgSURcbiAgICAgIC8vIFdlJ2xsIHVzZSBhIG1vcmUgZGlyZWN0IGFwcHJvYWNoIHdpdGggQ2xvdWRGb3JtYXRpb25cbiAgICAgIG5ldyBlYzIuQ2ZuUm91dGUoc2NvcGUsIGBQcml2YXRlSXB2NlJvdXRlJHtwcml2YXRlSW5kZXh9YCwge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IHN1Ym5ldC5yb3V0ZVRhYmxlLnJvdXRlVGFibGVJZCxcbiAgICAgICAgZGVzdGluYXRpb25JcHY2Q2lkckJsb2NrOiAnOjovMCcsXG4gICAgICAgIGVncmVzc09ubHlJbnRlcm5ldEdhdGV3YXlJZDogZWdyZXNzT25seUlndy5yZWYsXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFRoZSBMMiBWUEMgY29uc3RydWN0IGF1dG9tYXRpY2FsbHkgaGFuZGxlcyBJUHY0IHJvdXRpbmcgYW5kIElQdjYgcm91dGluZyBmb3IgcHVibGljIHN1Ym5ldHNcbiAgLy8gYnV0IHdlIG5lZWQgdG8gbWFudWFsbHkgYWRkIElQdjYgZWdyZXNzIHJvdXRlcyBmb3IgcHJpdmF0ZSBzdWJuZXRzXG5cbiAgcmV0dXJuIHsgdnBjLCBpcHY2Q2lkckJsb2NrLCB2cGNMb2dpY2FsSWQgfTtcbn1cbiJdfQ==