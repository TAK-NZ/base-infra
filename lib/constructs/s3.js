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
exports.createS3Resources = createS3Resources;
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
function createS3Resources(scope, stackName, region, kmsKey) {
    const configBucket = new s3.Bucket(scope, 'ConfigBucket', {
        bucketName: `${stackName.toLowerCase()}-${region}-env-config`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        enforceSSL: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        // Ownership controls and public access block are handled by above props
    });
    return { configBucket };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS0EsOENBWUM7QUFoQkQsdURBQXlDO0FBQ3pDLDZDQUE0QztBQUc1QyxTQUFnQixpQkFBaUIsQ0FBQyxLQUFnQixFQUFFLFNBQWlCLEVBQUUsTUFBYyxFQUFFLE1BQVc7SUFDaEcsTUFBTSxZQUFZLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUU7UUFDeEQsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLE1BQU0sYUFBYTtRQUM3RCxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEdBQUc7UUFDbkMsYUFBYSxFQUFFLE1BQU07UUFDckIsVUFBVSxFQUFFLElBQUk7UUFDaEIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7UUFDakQsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztRQUNwQyxlQUFlLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUI7UUFDekQsd0VBQXdFO0tBQ3pFLENBQUMsQ0FBQztJQUNILE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztBQUMxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEtleSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUzNSZXNvdXJjZXMoc2NvcGU6IENvbnN0cnVjdCwgc3RhY2tOYW1lOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nLCBrbXNLZXk6IEtleSkge1xuICBjb25zdCBjb25maWdCdWNrZXQgPSBuZXcgczMuQnVja2V0KHNjb3BlLCAnQ29uZmlnQnVja2V0Jywge1xuICAgIGJ1Y2tldE5hbWU6IGAke3N0YWNrTmFtZS50b0xvd2VyQ2FzZSgpfS0ke3JlZ2lvbn0tZW52LWNvbmZpZ2AsXG4gICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5LTVMsXG4gICAgZW5jcnlwdGlvbktleToga21zS2V5LFxuICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgb2JqZWN0T3duZXJzaGlwOiBzMy5PYmplY3RPd25lcnNoaXAuQlVDS0VUX09XTkVSX0VORk9SQ0VELFxuICAgIC8vIE93bmVyc2hpcCBjb250cm9scyBhbmQgcHVibGljIGFjY2VzcyBibG9jayBhcmUgaGFuZGxlZCBieSBhYm92ZSBwcm9wc1xuICB9KTtcbiAgcmV0dXJuIHsgY29uZmlnQnVja2V0IH07XG59XG4iXX0=