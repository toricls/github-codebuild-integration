# github-codebuild-integration

[![GitHub release](http://img.shields.io/github/release/toricls/github-codebuild-integration.svg?style=flat-square)][release]
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)][license]

[release]: https://github.com/toricls/github-codebuild-integration/releases
[license]: https://github.com/toricls/github-codebuild-integration/blob/master/LICENSE

github-codebuild-integration is a CI dispatching/status handling tool to integrate AWS CodeBuild with GitHub Push/Pull-Request webhook events, created with love of Serverless Architecture.

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

### AWS account / github-codebuild-integration / GitHub repository

github-codebuild-integration allows you to provision multiple installations in one AWS account as follows:

Resources | Relation
---------- | ----------
AWS account : github-codebuild-integration installations | 1 : n
github-codebuild-integration installation : GitHub repository | 1 : 1
GitHub repository : AWS CodeBuild project | 1 : 1 (will be extended to 1 : n in the future)

As mentioned above, github-codebuild-integration can be installed as many as you want to integrate with your GitHub repositories. If you want to build 3 repositories, you may provision 3 of github-codebuild-integration installation for instance.

## Background

GitHub has a feature to show each commit's status like 'success', 'failure', 'pending' on their Commit/PR pages, and based on that status, we can protect any branches from CI failed branch to be merged.

GitHub accepts status creation via their APIs and many third-party CI services implement functionalities to integrate with that APIs to show their job status on GitHub.

On the other hand, AWS CodeBuild doesn't have such a feature to save its build project status to GitHub for now. github-codebuild-integration is a missing piece of AWS CodeBuild to make things better.

## Requirements

### Prerequisites

github-codebuild-integration requires the following to be installed on your AWS account.

### Required Tools

We provide Makefile to you to manage github-codebuild-integration's lifecycle.

- GNU Make (if you are using macOS, `brew install make` is handy)

Provided commands use the following tools:

- Node.js v6.10 or later
- Yarn v0.27.5 or later
- AWS-CLI 1.11.132 or later
- curl

### Required Accounts & Resources

- AWS Account
- `AdministratorAccess` to your AWS Account (to use AWS CloudFormation in the installation command)
- GitHub Account

And the listed resources below are created in the process of installation, which means they are required as available AWS services in a region where you want to run github-codebuild-integration.

- Amazon S3
- Amazon SNS
- AWS Lambda
- AWS Step Functions
- AWS CodeBuild
- AWS IAM
- AWS CloudFormation

## Installation

_**NOTE: Make sure the following before proceeding.**_  
_**- You've loaded your [AWS credentials](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).**_  
_**- You've already created one AWS CodeBuild project at least.**_

### AWS Account-wide Resource

We have to create an S3 Bucket to store github-codebuild-integration's artifacts to provision it.

```
$ aws s3api create-bucket \
    --bucket {YOUR_S3_BUCKET_NAME} \
    --create-bucket-configuration LocationConstraint=$AWS_DEFAULT_REGION
```

_**NOTE: If you plan installing github-codebuild-integration into multiple AWS regions, you may create an S3 bucket for each AWS region.**_

### Per-Project Resources

#### Configure parameters

Copy example configuration file and edit it to configure paramters for your GitHub repository.

```
$ export YOUR_PROJECT_NAME=xxxxxxxxxxxxxxxxx
$ cp env/example.env env/$YOUR_PROJECT_NAME.env
$ editor env/$YOUR_PROJECT_NAME.env
```

Next table describes about all available parameters of github-codebuild-integration.

Required | Parameter Name | What is this | Example
------------ | ------------ | ------------- | ------------- 
yes | S3_SAM_ARTIFACTS_BUCKET_NAME | An S3 bucket to store AWS SAM's artifacts. Set the name of the S3 bucket you created on previous step. | your.sam.artifacts.bucket
yes | GITHUB_REPOSITORY_URL | A repository URL you wanted build. Use https style path and make sure trailing '.git' is removed. | https://github.com/your-org/your-repo
yes | GITHUB_PERSONAL_ACCESS_TOKEN | Used for updating GitHub PR's status and Webhook configuration. Minimum scope are `admin:repo_hook` and `repo:status`. You can create and obtain a new token via [settings page](https://github.com/settings/tokens/new). | your-github-personal-access-token
yes | GITHUB_TARGET_RESOURCE | Choose one event to decide when your CodeBuild project runs. Available value is `pr` or `push`. | push
optional | GITHUB_IGNORE_BRANCH_REGEX | Regex string to specify branch name to ignore commit events. This parameter will be enabled only the `GITHUB_TARGET_RESOURCE` value is set to `push`. | wip.*
yes | AWS_DEFAULT_REGION | The region where you want to provision this tool via CloudFormation. | us-east-1
yes | CODEBUILD_PROJECT_NAME | The AWS CodeBuild project name you've already configured for your GitHub repository. | your-codebuild-project-name
yes | CODEBUILD_PROJECT_REGION | The region where you've created a CodeBuild project. You can specify a different region from the region of CloudFormation. | us-east-1

#### Deploy

Package all artifacts and deploy to your AWS account.

```
$ make deploy ENV_FILE=env/$YOUR_PROJECT_NAME.env
```

## Uninstall

You can delete most of generated resources by executing:

```
$ make destroy ENV_FILE=env/YOUR-PROJECT-NAME.env
```

_**NOTE: CloudFormation doesn't delete CloudWatch's Log Groups. You may want to remove it manually on the AWS Management Console or via the AWS CLI. Also you may want to remove the S3 Bucket(s) you created.**_

## FAQ

### Installation & Uninstallation

Q. My IAM role is too weak to install your tool, I guess.

A. Ask your administrator and show him/her the following:
- [Required Accounts & Resources][required-accounts--resources] section
- This tool uses CloudFormation with `--capabilities "CAPABILITY_IAM"` option

[required-accounts--resources]: https://github.com/toricls/github-codebuild-integration/blob/master/README.md#required-accounts--resources

Q: I want to remove all resources of github-codebuild-integration from my AWS account.

A: Read the [Uninstall][uninstall] section above :X

[uninstall]: https://github.com/toricls/github-codebuild-integration/blob/master/README.md#uninstall

### Changing Configurations

Q: I changed my repository name after github-codebuild-integration install.

A: Change the value of `GITHUB_REPOSITORY_URL` in your env file, then deploy again.

Q: I want to stop CI invoking for a bit.

A: Open `GitHubWebhookHandler` function (the function name on the Lambda Management Console may something like `YOUR-PROJECT-NAME-GitHubWebhookHandler-XXXXXXXXXXX`), then set `true` to the environment variable `DO_NOT_RUN`.  
Don't forget to back that value to `false` after your quick work.

### Feature Request

Q: I want to skip CI by adding a tag like `[skip ci]` in commit messages.

A: It is planned, but not now.

Q: I need more than one AWS CodeBuild project for my GitHub repository.

A: I totally agree with you! It will be supported in the future. I think the feature will be implemented with a mapping configuration for 'branch name reg-expressions' and 'AWS CodeBuild projects'. But PRs are always welcome :smiley:

Q. Can you change the icon which shown at PR page's CI status?

A. GitHub shows the avatar of the user who owns the personal access token you provided. You can change the icon by using something like [Machine users](https://developer.github.com/v3/guides/managing-deploy-keys/#machine-users) to create a personal access token for github-codebuild-integration.

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
