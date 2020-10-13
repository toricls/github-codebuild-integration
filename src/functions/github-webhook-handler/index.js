'use strict'

const AWS = require('aws-sdk'),
    codebuild = new AWS.CodeBuild()
const GitHubApi = require('@octokit/rest'),
    github = new GitHubApi({version: '3.0.0'})
const ghUrl = require('parse-github-url'),
    repo = ghUrl(process.env.GITHUB_REPOSITORY_URL)
const region = process.env.CODEBUILD_PROJECT_REGION
const ghEventType = require('./lib/event-types').ghEventType,
    shouldIgnore = require('./lib/should-ignore').shouldIgnore

github.authenticate({type:'oauth', token: process.env.GITHUB_TOKEN})

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    //console.log('Received event:', JSON.stringify(event, null, 2));
    const message = event.Records[0].Sns.Message,
        ghEvent = JSON.parse(message)

    const eventType = ghEventType(ghEvent),
        eventAction = ghEvent.action ? ghEvent.action : '',
        branchName = ghEvent.ref ? ghEvent.ref : ghEvent.ref.replace('refs/heads',''),
        commitMessage = ghEvent.head_commit ? ghEvent.head_commit.message : ''
    if (shouldIgnore(eventType, eventAction, branchName, commitMessage)) {
        callback()
    }

    // Execute CodeBuild Project
    const sha = ghEvent.pull_request ? ghEvent.pull_request.head.sha : ghEvent.head_commit.id
    const params = {
        projectName: process.env.CODEBUILD_PROJECT_NAME,
        sourceVersion: sha
    }
    codebuild.startBuild(params, (err, data) => {
        // Create GitHub status
        if (err) {
            // If CodeBuild couldn't start a build, save GitHub status as 'error'
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
            github.repos.createStatus({
                owner: repo.owner,
                repo: repo.name,
                sha: sha,
                state: 'pending',
                target_url: `https://${region}.console.aws.amazon.com/codebuild/home?region=${region}#/builds/${data.build.id}/view/new`,
                context: 'codebuild',
                description: 'AWS CodeBuild is starting your tests'
            }).then((data) => {
                callback(null, data)
            }).catch((err) => {
                console.log(err, err.stack)
                callback(err)
            })
        }
    })
}
