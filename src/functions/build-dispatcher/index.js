'use strict'

// TODO: too dirty

const AWS = require('aws-sdk'),
    codebuild = new AWS.CodeBuild()

const GitHubApi = require('github'),
    github = new GitHubApi({version: '3.0.0'})

const ghUrl = require('parse-github-url'),
    repo = ghUrl(process.env.GITHUB_REPOSITORY_URL)

const region = process.env.CODEBUILD_PROJECT_REGION

github.authenticate({type:'oauth', token: process.env.GITHUB_TOKEN})

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Received event:', JSON.stringify(event, null, 2))
    const sha = event.pull_request ? event.pull_request.head.sha : event.head_commit.id
    const params = {
        projectName: process.env.CODEBUILD_PROJECT_NAME,
        sourceVersion: sha
    }
    codebuild.startBuild(params, (err, data) => {
        // Create GitHub status
        if (err) {
            // If CodeBuild cannot start a build, save GitHub status as 'error'
            console.log(err, err.stack)
            github.repos.createStatus({
                owner: repo.owner,
                repo: repo.name,
                sha: sha,
                state: 'error',
                target_url: `https://${region}.console.aws.amazon.com/codebuild/home?region=${region}#/builds`,
                context: 'codebuild',
                description: 'AWS CodeBuild has failed to start your tests'
            }).then(() => {
                callback(err)
            }).catch((err) => {
                callback(err)
            })
        } else {
            let build = data.build
            github.repos.createStatus({
                owner: repo.owner,
                repo: repo.name,
                sha: sha,
                state: 'pending',
                target_url: `https://${region}.console.aws.amazon.com/codebuild/home?region=${region}#/builds/${data.build.id}/view/new`,
                context: 'codebuild',
                description: 'AWS CodeBuild is running your tests'
            }).then((data) => {
                console.log(data)
                callback(null, build)
            }).catch((err) => {
                console.log(err, err.stack)
                callback(err)
            })
        }
    })
}
