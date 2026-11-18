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
- :arrow_up: Upgrade aws-cdk-lib to 2.277.0 and aws-cdk CLI to 2.1148.1 (constructs already latest at 10.8.1)
- :bug: Add `minimatch` ^11.0.1 and `glob` ^14.0.2 overrides to resolve `npm audit` findings in the Jest tree. Two moderate findings remain from the `minimatch` bundled inside `aws-cdk-lib` until a release includes aws/aws-cdk#39595
- :bug: Restore `.npmrc` with `audit-level=critical` and a note on the remaining bundled `minimatch` finding (GHSA-g3hv-75wg-m249), matching auth-infra, tak-infra and utils-infra
- :bug: Fix ELB logs bucket policy failing with `Invalid principal in policy` in opt-in regions such as `ap-southeast-6` (#97). Grant only the deployment region's legacy ELB account (none for regions launched after August 2022) and scope log writes to `AWSLogs/<account-id>/*`
- :white_check_mark: Update ELB bucket policy tests to cover legacy, GovCloud and `ap-southeast-6` regions
- :arrow_up: Upgrade dev dependencies jest to 30.5.2 and @types/jest to 30.0.0 to resolve `npm audit` findings
- :bug: Add `js-yaml` ^4.1.1 override to remove vulnerable `sprintf-js` from the Jest tree; remove `.npmrc` `audit-level=critical` suppression


### v1.0.0

- :rocket: Initial Release using AWS CDK
