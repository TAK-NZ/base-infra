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
exports.createEcrResources = createEcrResources;
const cdk = __importStar(require("aws-cdk-lib"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
function createEcrResources(scope, stackName) {
    const repoName = stackName.toLowerCase().replace(/[^a-z0-9\-_.]/g, '-').replace(/^-+|-+$/g, '');
    // Create the ECR repository
    const ecrRepo = new ecr.Repository(scope, 'Repository', {
        repositoryName: repoName,
        lifecycleRules: [
            {
                description: 'Expire untagged images older than 8 days',
                rulePriority: 1,
                tagStatus: ecr.TagStatus.UNTAGGED,
                maxImageAge: cdk.Duration.days(8),
            },
        ],
        // ECR will not be retained after stack deletion
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // Add a resource policy (repository policy)
    ecrRepo.addToResourcePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
    }));
    return { ecrRepo };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLQSxnREEwQkM7QUEvQkQsaURBQW1DO0FBRW5DLHlEQUEyQztBQUMzQyx5REFBMkM7QUFFM0MsU0FBZ0Isa0JBQWtCLENBQUMsS0FBZ0IsRUFBRSxTQUFpQjtJQUNwRSxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFaEcsNEJBQTRCO0lBQzVCLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFO1FBQ3RELGNBQWMsRUFBRSxRQUFRO1FBQ3hCLGNBQWMsRUFBRTtZQUNkO2dCQUNFLFdBQVcsRUFBRSwwQ0FBMEM7Z0JBQ3ZELFlBQVksRUFBRSxDQUFDO2dCQUNmLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVE7Z0JBQ2pDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbEM7U0FDRjtRQUNELGdEQUFnRDtRQUNoRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO0tBQ3pDLENBQUMsQ0FBQztJQUVILDRDQUE0QztJQUM1QyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1FBQ2xELE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7UUFDeEIsVUFBVSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDcEMsT0FBTyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsNEJBQTRCLENBQUM7S0FDN0QsQ0FBQyxDQUFDLENBQUM7SUFFSixPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGVjciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVjclJlc291cmNlcyhzY29wZTogQ29uc3RydWN0LCBzdGFja05hbWU6IHN0cmluZykge1xuICBjb25zdCByZXBvTmFtZSA9IHN0YWNrTmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16MC05XFwtXy5dL2csICctJykucmVwbGFjZSgvXi0rfC0rJC9nLCAnJyk7XG5cbiAgLy8gQ3JlYXRlIHRoZSBFQ1IgcmVwb3NpdG9yeVxuICBjb25zdCBlY3JSZXBvID0gbmV3IGVjci5SZXBvc2l0b3J5KHNjb3BlLCAnUmVwb3NpdG9yeScsIHtcbiAgICByZXBvc2l0b3J5TmFtZTogcmVwb05hbWUsXG4gICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdFeHBpcmUgdW50YWdnZWQgaW1hZ2VzIG9sZGVyIHRoYW4gOCBkYXlzJyxcbiAgICAgICAgcnVsZVByaW9yaXR5OiAxLFxuICAgICAgICB0YWdTdGF0dXM6IGVjci5UYWdTdGF0dXMuVU5UQUdHRUQsXG4gICAgICAgIG1heEltYWdlQWdlOiBjZGsuRHVyYXRpb24uZGF5cyg4KSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICAvLyBFQ1Igd2lsbCBub3QgYmUgcmV0YWluZWQgYWZ0ZXIgc3RhY2sgZGVsZXRpb25cbiAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICB9KTtcblxuICAvLyBBZGQgYSByZXNvdXJjZSBwb2xpY3kgKHJlcG9zaXRvcnkgcG9saWN5KVxuICBlY3JSZXBvLmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgYWN0aW9uczogWydlY3I6QmF0Y2hHZXRJbWFnZScsICdlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllciddLFxuICB9KSk7XG5cbiAgcmV0dXJuIHsgZWNyUmVwbyB9O1xufSJdfQ==