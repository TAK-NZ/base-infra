# CHANGELOG

## Emoji Cheatsheet
- :pencil2: doc updates
- :bug: when fixing a bug
- :rocket: when making general improvements
- :white_check_mark: when adding tests
- :arrow_up: when upgrading dependencies
- :tada: when adding new features

## Version History

### Pending Release
- :tada: Add an optional CloudTrail trail for management events (read and write), created by BaseInfra and on by default (#101). The trail is single-Region, has global service events off and log file validation on, and writes to a new SSE-S3 encrypted log bucket that is retained on stack deletion (retention set by `cloudTrail.logRetentionDays`, default 90 days). The trail name is exported as `TAK-<stack>-BaseInfra-CloudTrailName`. This trail is what lets the tak-infra Root CA alert see `kms:Sign` read events
- :tada: Add the `cloudTrail.enabled` setting and the `--context createCloudTrail=false` override. **Because the trail is on by default, accounts that already have a trail (e.g. 814704514736 and 453572736517) must set `createCloudTrail=false`**. An existing trail that only logs write events, or only other Regions, does not trigger the tak-infra Root CA alert
- :pencil2: Update `docs/AWS_GITHUB_SETUP.md` section 7.3 and `docs/PARAMETERS.md` for the CloudTrail setting
- :white_check_mark: Add CloudTrail construct, export and opt-out tests
- :arrow_up: Upgrade aws-cdk-lib to 2.278.0 and aws-cdk CLI to 2.1149.0. The bundled `minimatch` fix (aws/aws-cdk#39595) is included, so `npm audit` reports 0 vulnerabilities and the `.npmrc` `audit-level=critical` suppression is removed
- :arrow_up: Upgrade aws-cdk-lib to 2.277.0 and aws-cdk CLI to 2.1148.1 (constructs already latest at 10.8.1)
- :bug: Add `minimatch` ^11.0.1 and `glob` ^14.0.2 overrides to resolve `npm audit` findings in the Jest tree. Two moderate findings remain from the `minimatch` bundled inside `aws-cdk-lib` until a release includes aws/aws-cdk#39595
- :bug: Restore `.npmrc` with `audit-level=critical` and a note on the remaining bundled `minimatch` finding (GHSA-g3hv-75wg-m249), matching auth-infra, tak-infra and utils-infra
- :bug: Fix ELB logs bucket policy failing with `Invalid principal in policy` in opt-in regions such as `ap-southeast-6` (#97). Grant only the deployment region's legacy ELB account (none for regions launched after August 2022) and scope log writes to `AWSLogs/<account-id>/*`
- :white_check_mark: Update ELB bucket policy tests to cover legacy, GovCloud and `ap-southeast-6` regions
- :arrow_up: Upgrade dev dependencies jest to 30.5.2 and @types/jest to 30.0.0 to resolve `npm audit` findings
- :bug: Add `js-yaml` ^4.1.1 override to remove vulnerable `sprintf-js` from the Jest tree; remove `.npmrc` `audit-level=critical` suppression


### v1.0.0

- :rocket: Initial Release using AWS CDK
