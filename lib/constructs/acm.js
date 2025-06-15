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
exports.createAcmCertificate = createAcmCertificate;
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
function createAcmCertificate(scope, props) {
    if (!props.zoneName) {
        throw new Error('R53 zone name is required for ACM certificate creation');
    }
    // Look up the existing public hosted zone
    const hostedZone = route53.HostedZone.fromLookup(scope, 'PublicHostedZone', {
        domainName: props.zoneName,
        privateZone: false // Ensure it's a public zone
    });
    // Create ACM certificate with multiple domain names
    const certificate = new acm.Certificate(scope, 'PublicCertificate', {
        domainName: props.zoneName, // e.g., example.com
        subjectAlternativeNames: [
            `*.${props.zoneName}`, // e.g., *.example.com
            `*.map.${props.zoneName}` // e.g., *.map.example.com
        ],
        validation: acm.CertificateValidation.fromDns(hostedZone),
        transparencyLoggingEnabled: props.certificateTransparency ?? true,
    });
    return { certificate, hostedZone };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWNtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFVQSxvREF1QkM7QUFoQ0Qsd0VBQTBEO0FBQzFELGlFQUFtRDtBQVFuRCxTQUFnQixvQkFBb0IsQ0FBQyxLQUFnQixFQUFFLEtBQTBCO0lBQy9FLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO1FBQzFFLFVBQVUsRUFBRSxLQUFLLENBQUMsUUFBUTtRQUMxQixXQUFXLEVBQUUsS0FBSyxDQUFDLDRCQUE0QjtLQUNoRCxDQUFDLENBQUM7SUFFSCxvREFBb0Q7SUFDcEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRTtRQUNsRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxvQkFBb0I7UUFDaEQsdUJBQXVCLEVBQUU7WUFDdkIsS0FBSyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCO1lBQzdDLFNBQVMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLDBCQUEwQjtTQUNyRDtRQUNELFVBQVUsRUFBRSxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUN6RCwwQkFBMEIsRUFBRSxLQUFLLENBQUMsdUJBQXVCLElBQUksSUFBSTtLQUNsRSxDQUFDLENBQUM7SUFFSCxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBY21DZXJ0aWZpY2F0ZVByb3BzIHtcbiAgem9uZU5hbWU6IHN0cmluZztcbiAgY2VydGlmaWNhdGVUcmFuc3BhcmVuY3k/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQWNtQ2VydGlmaWNhdGUoc2NvcGU6IENvbnN0cnVjdCwgcHJvcHM6IEFjbUNlcnRpZmljYXRlUHJvcHMpIHtcbiAgaWYgKCFwcm9wcy56b25lTmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUjUzIHpvbmUgbmFtZSBpcyByZXF1aXJlZCBmb3IgQUNNIGNlcnRpZmljYXRlIGNyZWF0aW9uJyk7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBleGlzdGluZyBwdWJsaWMgaG9zdGVkIHpvbmVcbiAgY29uc3QgaG9zdGVkWm9uZSA9IHJvdXRlNTMuSG9zdGVkWm9uZS5mcm9tTG9va3VwKHNjb3BlLCAnUHVibGljSG9zdGVkWm9uZScsIHtcbiAgICBkb21haW5OYW1lOiBwcm9wcy56b25lTmFtZSxcbiAgICBwcml2YXRlWm9uZTogZmFsc2UgLy8gRW5zdXJlIGl0J3MgYSBwdWJsaWMgem9uZVxuICB9KTtcblxuICAvLyBDcmVhdGUgQUNNIGNlcnRpZmljYXRlIHdpdGggbXVsdGlwbGUgZG9tYWluIG5hbWVzXG4gIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IGFjbS5DZXJ0aWZpY2F0ZShzY29wZSwgJ1B1YmxpY0NlcnRpZmljYXRlJywge1xuICAgIGRvbWFpbk5hbWU6IHByb3BzLnpvbmVOYW1lLCAvLyBlLmcuLCBleGFtcGxlLmNvbVxuICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbXG4gICAgICBgKi4ke3Byb3BzLnpvbmVOYW1lfWAsIC8vIGUuZy4sICouZXhhbXBsZS5jb21cbiAgICAgIGAqLm1hcC4ke3Byb3BzLnpvbmVOYW1lfWAgLy8gZS5nLiwgKi5tYXAuZXhhbXBsZS5jb21cbiAgICBdLFxuICAgIHZhbGlkYXRpb246IGFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucyhob3N0ZWRab25lKSxcbiAgICB0cmFuc3BhcmVuY3lMb2dnaW5nRW5hYmxlZDogcHJvcHMuY2VydGlmaWNhdGVUcmFuc3BhcmVuY3kgPz8gdHJ1ZSxcbiAgfSk7XG5cbiAgcmV0dXJuIHsgY2VydGlmaWNhdGUsIGhvc3RlZFpvbmUgfTtcbn1cbiJdfQ==