'use strict'

const AWS = require('aws-sdk'),
    stepfunctions = new AWS.StepFunctions()
const GitHubApi = require('github'),
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

    // Create GitHub pending status
    const sha = ghEvent.pull_request ? ghEvent.pull_request.head.sha : ghEvent.head_commit.id
    const p = new Promise((resolve) => {
        github.repos.createStatus({
            owner: repo.owner,
            repo: repo.name,
            sha: sha,
            state: 'pending',
            target_url: `https://${region}.console.aws.amazon.com/codebuild/home?region=${region}#/builds`,
            context: 'codebuild',
            description: 'AWS CodeBuild is preparing your tests...'
        }).then((data) => {
            console.log(data)
            resolve('status created')
        }).catch((err) => {
            console.log(err)
            resolve('status creation failed')
        })
    })

    // Execute Step Functions
    p.then(() => {
        const params = {
            stateMachineArn: process.env.STEP_FUNCTIONS_ARN,
            input: JSON.stringify(ghEvent)
        }
        stepfunctions.startExecution(params, function(err, data) {
            if (err) {
                console.log(err, err.stack)
                callback(err)
            } else {
                callback(null, data)
            }
        })
    })
}
