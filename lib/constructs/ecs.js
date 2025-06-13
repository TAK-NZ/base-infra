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
exports.createEcsResources = createEcsResources;
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
function createEcsResources(scope, stackName, vpc) {
    // Use the L2 construct for ECS Cluster, passing the provided VPC
    const ecsCluster = new ecs.Cluster(scope, 'ECSCluster', {
        clusterName: stackName,
        vpc,
    });
    ecsCluster.enableFargateCapacityProviders();
    // Do not set addDefaultCapacityProviderStrategy for FARGATE-only clusters; FARGATE is default
    return { ecsCluster };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxnREFTQztBQVpELHlEQUEyQztBQUczQyxTQUFnQixrQkFBa0IsQ0FBQyxLQUFnQixFQUFFLFNBQWlCLEVBQUUsR0FBYTtJQUNuRixpRUFBaUU7SUFDakUsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUU7UUFDdEQsV0FBVyxFQUFFLFNBQVM7UUFDdEIsR0FBRztLQUNKLENBQUMsQ0FBQztJQUNILFVBQVUsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO0lBQzVDLDhGQUE4RjtJQUM5RixPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZWNzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWNzUmVzb3VyY2VzKHNjb3BlOiBDb25zdHJ1Y3QsIHN0YWNrTmFtZTogc3RyaW5nLCB2cGM6IGVjMi5JVnBjKSB7XG4gIC8vIFVzZSB0aGUgTDIgY29uc3RydWN0IGZvciBFQ1MgQ2x1c3RlciwgcGFzc2luZyB0aGUgcHJvdmlkZWQgVlBDXG4gIGNvbnN0IGVjc0NsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIoc2NvcGUsICdFQ1NDbHVzdGVyJywge1xuICAgIGNsdXN0ZXJOYW1lOiBzdGFja05hbWUsXG4gICAgdnBjLFxuICB9KTtcbiAgZWNzQ2x1c3Rlci5lbmFibGVGYXJnYXRlQ2FwYWNpdHlQcm92aWRlcnMoKTtcbiAgLy8gRG8gbm90IHNldCBhZGREZWZhdWx0Q2FwYWNpdHlQcm92aWRlclN0cmF0ZWd5IGZvciBGQVJHQVRFLW9ubHkgY2x1c3RlcnM7IEZBUkdBVEUgaXMgZGVmYXVsdFxuICByZXR1cm4geyBlY3NDbHVzdGVyIH07XG59XG4iXX0=