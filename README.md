<h1 align=center>TAK VPC</h1>

<p align=center>TAK Base Layer (VPC, ECS, ECR, S3, KMS)</p>

## Background

The [Team Awareness Kit (TAK)](https://tak.gov/solutions/emergency) provides Fire, Emergency Management, and First Responders an operationally agnostic tool for improved situational awareness and a common operational picture. 
This repo deploys the base infrastructure required to deploy a [TAK server](https://tak.gov/solutions/emergency) along with [Authentik](https://goauthentik.io/) as the authentication layer on AWS.

The following additional layers are required after deploying this `coe-base-<name>` layer:

| Name                  | Notes |
| --------------------- | ----- |
| `coe-auth-<name>`     | Authentication layer using Authentik - [repo](https://github.com/TAK-NZ/auth-infra)      |
| `coe-tak-<name>`      | TAK Server layer - [repo](https://github.com/TAK-NZ/tak-infra)      |

## Pre-Reqs

The following dependencies must be fulfilled:
- An [AWS Account](https://signin.aws.amazon.com/signup?request_type=register).
- A Domain Name under which the TAK server is made available, e.g. `tak.nz` in the example here.
- An [AWS ACM certificate](https://docs.aws.amazon.com/acm/latest/userguide/gs.html) certificate.
  - This certificate should cover the main domain - e.g. `tak.nz`, as well as `*.<domain name>` and `*.map.<domain name>`. E.g. `*.tak.nz` and `*.map.tak.nz`.

## AWS Deployment

### 1. Install Tooling Dependencies

From the root directory, install the deploy dependencies

```sh
npm install
```

### 2. CloudFormation Stack Deployment
Deployment to AWS is handled via AWS Cloudformation. The template can be found in the `./cloudformation`
directory. The deployment itself is performed by [Deploy](https://github.com/openaddresses/deploy) which
was installed in the previous step.

Deployment can then be performed via the `npx deploy create <stack>` command. 

For example:

```
npx deploy create staging
```

## About the deploy tool

The deploy tool can be run via the `npx deploy` command.

To install it globally - view the deploy [README](https://github.com/openaddresses/deploy)

Deploy uses your existing AWS credentials. Ensure that your `~/.aws/credentials` has an entry like:
 
```
[coe]
aws_access_key_id = <redacted>
aws_secret_access_key = <redacted>
```

Stacks can be created, deleted, cancelled, etc all via the deploy tool. For further information
information about `deploy` functionality run the following for help.
 
```sh
npx deploy
```
 
Further help about a specific command can be obtained via something like:

```sh
npx deploy info --help
```

## Estimated Cost

The estimated AWS cost for this layer of the stack without data transfer or data processing based usage is:

| Environment type      | Estimated monthly cost | Estimated yearly cost |
| --------------------- | ----- | ----- |
| Prod                  | 80.00 USD | 960.00 USD |
| Dev-Test              | 43.50 USD | 522.00 USD |
