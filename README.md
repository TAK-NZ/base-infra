<h1 align=center>TAK VPC</h1>

<p align=center>Create and Manage VPCs with CloudFormation</p>

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

> [!NOTE] 
> The deploy tool can be run via the following
>
> ```sh
> npx deploy
> ```
>
> To install it globally - view the deploy [README](https://github.com/openaddresses/deploy)
>
> Deploy uses your existing AWS credentials. Ensure that your `~/.aws/credentials` has an entry like:
> 
> ```
> [coe]
> aws_access_key_id = <redacted>
> aws_secret_access_key = <redacted>
> ```

Deployment can then be performed via the following:

```
npx deploy create <stack>
```

> [!NOTE] 
> Stacks can be created, deleted, cancelled, etc all via the deploy tool. For further information
> information about `deploy` functionality run the following for help.
> 
> ```sh
> npx deploy
> ```
> 
> Further help about a specific command can be obtained via something like:
> 
> ```sh
> npx deploy info --help
> ```

## Estimated Cost

The estimated AWS cost for this part stack without data transfer or data processing based usage is:

* Environment type: Prod
  * Monthly cost: 73.00 USD
  * Yearly cost: 876.00 USD
* Environment type: Dev-Test
  * Monthly cost: 36.50 USD
  * Yearly cost: 438.00 USD


Refer to this [AWS Pricing Calculator estimate](https://calculator.aws/#/estimate?id=0c1627738c15618c39af432977318f3ea5947b2d) for more details.
