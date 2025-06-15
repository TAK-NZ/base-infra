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
                description: 'Expire untagged images older than 1 day',
                rulePriority: 1,
                tagStatus: ecr.TagStatus.UNTAGGED,
                maxImageAge: cdk.Duration.days(1),
            },
            {
                description: 'Keep only the last 5 versions of tagged images',
                rulePriority: 2,
                tagStatus: ecr.TagStatus.TAGGED,
                tagPatternList: ['*'],
                maxImageCount: 5,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLQSxnREFpQ0M7QUF0Q0QsaURBQW1DO0FBRW5DLHlEQUEyQztBQUMzQyx5REFBMkM7QUFFM0MsU0FBZ0Isa0JBQWtCLENBQUMsS0FBZ0IsRUFBRSxTQUFpQjtJQUNwRSxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFaEcsNEJBQTRCO0lBQzVCLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFO1FBQ3RELGNBQWMsRUFBRSxRQUFRO1FBQ3hCLGNBQWMsRUFBRTtZQUNkO2dCQUNFLFdBQVcsRUFBRSx5Q0FBeUM7Z0JBQ3RELFlBQVksRUFBRSxDQUFDO2dCQUNmLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVE7Z0JBQ2pDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbEM7WUFDRDtnQkFDRSxXQUFXLEVBQUUsZ0RBQWdEO2dCQUM3RCxZQUFZLEVBQUUsQ0FBQztnQkFDZixTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNO2dCQUMvQixjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3JCLGFBQWEsRUFBRSxDQUFDO2FBQ2pCO1NBQ0Y7UUFDRCxnREFBZ0Q7UUFDaEQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztLQUN6QyxDQUFDLENBQUM7SUFFSCw0Q0FBNEM7SUFDNUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztRQUNsRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1FBQ3hCLFVBQVUsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3BDLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixFQUFFLDRCQUE0QixDQUFDO0tBQzdELENBQUMsQ0FBQyxDQUFDO0lBRUosT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFY3JSZXNvdXJjZXMoc2NvcGU6IENvbnN0cnVjdCwgc3RhY2tOYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgcmVwb05hbWUgPSBzdGFja05hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOVxcLV8uXS9nLCAnLScpLnJlcGxhY2UoL14tK3wtKyQvZywgJycpO1xuXG4gIC8vIENyZWF0ZSB0aGUgRUNSIHJlcG9zaXRvcnlcbiAgY29uc3QgZWNyUmVwbyA9IG5ldyBlY3IuUmVwb3NpdG9yeShzY29wZSwgJ1JlcG9zaXRvcnknLCB7XG4gICAgcmVwb3NpdG9yeU5hbWU6IHJlcG9OYW1lLFxuICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwaXJlIHVudGFnZ2VkIGltYWdlcyBvbGRlciB0aGFuIDEgZGF5JyxcbiAgICAgICAgcnVsZVByaW9yaXR5OiAxLFxuICAgICAgICB0YWdTdGF0dXM6IGVjci5UYWdTdGF0dXMuVU5UQUdHRUQsXG4gICAgICAgIG1heEltYWdlQWdlOiBjZGsuRHVyYXRpb24uZGF5cygxKSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnS2VlcCBvbmx5IHRoZSBsYXN0IDUgdmVyc2lvbnMgb2YgdGFnZ2VkIGltYWdlcycsXG4gICAgICAgIHJ1bGVQcmlvcml0eTogMixcbiAgICAgICAgdGFnU3RhdHVzOiBlY3IuVGFnU3RhdHVzLlRBR0dFRCxcbiAgICAgICAgdGFnUGF0dGVybkxpc3Q6IFsnKiddLFxuICAgICAgICBtYXhJbWFnZUNvdW50OiA1LFxuICAgICAgfSxcbiAgICBdLFxuICAgIC8vIEVDUiB3aWxsIG5vdCBiZSByZXRhaW5lZCBhZnRlciBzdGFjayBkZWxldGlvblxuICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gIH0pO1xuXG4gIC8vIEFkZCBhIHJlc291cmNlIHBvbGljeSAocmVwb3NpdG9yeSBwb2xpY3kpXG4gIGVjclJlcG8uYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkFueVByaW5jaXBhbCgpXSxcbiAgICBhY3Rpb25zOiBbJ2VjcjpCYXRjaEdldEltYWdlJywgJ2VjcjpHZXREb3dubG9hZFVybEZvckxheWVyJ10sXG4gIH0pKTtcblxuICByZXR1cm4geyBlY3JSZXBvIH07XG59Il19