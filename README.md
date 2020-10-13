# github-codebuild-integration (gci)

[![GitHub release](https://img.shields.io/github/release/toricls/github-codebuild-integration.svg?style=flat-square)][release]
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)][license]

[release]: https://github.com/toricls/github-codebuild-integration/releases
[license]: https://github.com/toricls/github-codebuild-integration/blob/master/LICENSE

`gci` is a CI dispatching/status handling tool to integrate AWS CodeBuild with GitHub Push/Pull-Request webhook events, created with love of Serverless Architecture.

## Overview

Yay, Serverless!

[![Overview](https://github.com/toricls/github-codebuild-integration/wiki/res/overview-800x463.png)](https://github.com/toricls/github-codebuild-integration/wiki/res/overview.png)

**Commits:**

[![Commits](https://github.com/toricls/github-codebuild-integration/wiki/res/commits-300x234.png)](https://github.com/toricls/github-codebuild-integration/wiki/res/commits.png)

**Pull Request:**

[![Pull Request](https://github.com/toricls/github-codebuild-integration/wiki/res/pr-600x394.png)](https://github.com/toricls/github-codebuild-integration/wiki/res/pr.png)

## Features

- Invoking a pre-configured AWS CodeBuild project by hooking Push or Pull Reqeust webhook events.
- Setting GitHub's CI status based on status/result of builds on AWS CodeBuild.

### AWS account / gci / GitHub repository

gci allows you to provision multiple installations in one AWS account as follows:

Resources | Relation
---------- | ----------
AWS account : gci installations | 1 : n
gci installation : GitHub repository | 1 : 1
GitHub repository : AWS CodeBuild project | 1 : 1 (will be extended to 1 : n in the future)

As mentioned above, gci can be installed as many as you want to integrate with your GitHub repositories. If you want to build 3 repositories, you may provision 3 of gci installation for instance.

## Background

GitHub has a feature to show each commit's status like 'success', 'failure', 'pending' on their Commit/PR pages, and based on that status, we can protect any branches from CI failed branch to be merged.

GitHub accepts status creation via their APIs and many third-party CI services implement functionalities to integrate with that APIs to show their job status on GitHub.

~~On the other hand, AWS CodeBuild doesn't have such a feature to save its build project status to GitHub for now. gci is a missing piece of AWS CodeBuild to make things better.~~ I heard that AWS CodeBuild now supports for building by GitHub push/PR and for updating GitHub status natively. We'll find another motivation to keep developing gci :stuck_out_tongue:

## Requirements

### Prerequisites

gci requires the following to be installed on your AWS account.

### Required Tools

We use a Makefile to manage gci's lifecycle.

- GNU Make (if you are using macOS, `brew install make` is handy)

The Makefile depends on the following tools:

- Node.js v14.1.0 or later
- Yarn 1.22.0 or later
- AWS-CLI 1.11.132 or later
- curl

### Required Accounts & Resources

- AWS Account
- `AdministratorAccess` to your AWS Account (to use AWS CloudFormation in the installation command)
- GitHub Account

And the listed resources below are created in the process of installation, which means they are required as available AWS services in a region where you want to run gci.

- Amazon S3
- Amazon SNS
- Amazon CloudWatch Events
- AWS Lambda
- AWS CodeBuild
- AWS IAMv
- AWS CloudFormation

## Installation

_**NOTE: Make sure you already have:**_  
_**- [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) for AWS CLI access.**_  
_**- at least one AWS CodeBuild project created.**_

### AWS Account-wide Resource

Create an S3 Bucket to store gci's artifacts to proceed.

```
$ aws s3api create-bucket \
    --bucket {YOUR_S3_BUCKET_NAME} \
    --create-bucket-configuration LocationConstraint=$AWS_DEFAULT_REGION
```

_**NOTE: Create an S3 bucket for each AWS region if you use gci in multiple AWS regions.**_

### Per-Project Resources

#### Clone this repository

```
$ git clone https://github.com/toricls/github-codebuild-integration.git
$ cd $(pwd)/github-codebuild-integration
```

#### Create GitHub Personal Access Token

Open [New personal access token](https://github.com/settings/tokens/new) page and create one for a gci's installation.

Input token description like `codebuild-YOUR_REPO_NAME` and enable `admin:repo_hook` and `repo:status` as scopes, then click the `Generate token` button.

Copy the personal access token value and proceed to the next section, "Configure parameters".

#### Configure parameters

Copy example configuration file and edit it to configure paramters for your GitHub repository.

```
$ export YOUR_PROJECT_NAME=xxxxxxxxxxxxxxxxx
$ cp env/example.env env/$YOUR_PROJECT_NAME.env
$ editor env/$YOUR_PROJECT_NAME.env
```

Next table describes about all available parameters of gci.

Required | Parameter Name | What is this | Example
------------ | ------------ | ------------- | ------------- 
yes | S3_SAM_ARTIFACTS_BUCKET_NAME | An S3 bucket to store AWS SAM's artifacts. Set the name of the S3 bucket you created on previous step. | your.sam.artifacts.bucket
yes | GITHUB_REPOSITORY_URL | A repository URL you wanted build. Use https style path and make sure trailing '.git' is removed. | https://github.com/your-org/your-repo
yes | GITHUB_PERSONAL_ACCESS_TOKEN | Used for updating GitHub PR's status and Webhook configuration. Minimum scope are `admin:repo_hook` and `repo:status`. You can create and obtain a new token via [settings page](https://github.com/settings/tokens/new). | your-github-personal-access-token
yes | GITHUB_TARGET_RESOURCE | Choose one event to decide when your CodeBuild project runs. Available value is `pr` or `push`. | push
optional | GITHUB_IGNORE_BRANCH_REGEX | Regex string to specify branch name to ignore commit events. This parameter will be enabled only the `GITHUB_TARGET_RESOURCE` value is `push`. | wip.*
yes | AWS_DEFAULT_REGION | The region where you want to provision this tool via CloudFormation. | us-east-1
yes | CODEBUILD_PROJECT_NAME | The AWS CodeBuild project name you've already configured for your GitHub repository. | your-codebuild-project-name
yes | CODEBUILD_PROJECT_REGION | The region where you've created a CodeBuild project. You can specify a different region from the region of CloudFormation. | us-east-1
optional | BUILD_SKIPPED_BY | Build invocation will be skipped if the head commit message includes the value of this parameter. This parameter will be used only the GITHUB_TARGET_RESOURCE value is `push`. | "skip ci"

#### Deploy

Package all artifacts and deploy to your AWS account. You can use this command to update your existing gci installation.

```
$ make deploy ENV_FILE_PATH=env/$YOUR_PROJECT_NAME.env
```

## Uninstall

You can delete most of generated resources by executing:

```
$ make destroy ENV_FILE_PATH=env/YOUR-PROJECT-NAME.env
```

_**NOTE: CloudFormation doesn't delete CloudWatch's Log Groups. You may want to remove it manually on the AWS Management Console or via the AWS CLI. Also you may want to remove the S3 Bucket(s) you created.**_

## FAQ

### Installation & Uninstallation

Q. My IAM role is too weak to install your tool, I guess.

A. Ask your administrator and show him/her the following:
- [Required Accounts & Resources][required-accounts--resources] section
- This tool uses CloudFormation with `--capabilities "CAPABILITY_IAM"` option

[required-accounts--resources]: https://github.com/toricls/github-codebuild-integration/blob/master/README.md#required-accounts--resources

Q: I want to remove all resources of gci from my AWS account.

A: Read the [Uninstall][uninstall] section above :X

[uninstall]: https://github.com/toricls/github-codebuild-integration/blob/master/README.md#uninstall

### Changing Configurations

Q: I changed my repository name after gci install.

A: Change the value of `GITHUB_REPOSITORY_URL` in your env file, then deploy again.

Q: I want to stop CI invoking for a bit.

A: Open `GitHubWebhookHandler` function (the function name on the Lambda Management Console may something like `YOUR-PROJECT-NAME-GitHubWebhookHandler-XXXXXXXXXXX`), then set `true` to the environment variable `DO_NOT_RUN`.  
Don't forget to back that value to `false` after your quick work.

### Feature Request

Q: I need more than one AWS CodeBuild project for my GitHub repository.

A: I totally agree with you! It will be supported in the future. I think the feature will be implemented with a mapping configuration for 'branch name reg-expressions' and 'AWS CodeBuild projects'. But PRs are always welcome :smiley:

Q. Can you change the icon which shown at PR page's CI status?

A. GitHub shows the avatar of the user who owns the personal access token you provided. You can change the icon by using something like [Machine users](https://developer.github.com/v3/guides/managing-deploy-keys/#machine-users) to create a personal access token for gci.

## Contribution

1. Fork ([https://github.com/toricls/github-codebuild-integration/fork](https://github.com/toricls/github-codebuild-integration/fork))
1. Create a feature branch
1. Commit your changes
1. Rebase your local changes against the master branch
1. Create a new Pull Request

## Licence

[MIT](LICENCE)

## Author

[toricls](https://github.com/toricls)
