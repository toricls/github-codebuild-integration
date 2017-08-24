'use strict'

const GitHubApi = require('github'),
    github = new GitHubApi({version: '3.0.0'})
const ghUrl = require('parse-github-url'),
    repo = ghUrl(process.env.GITHUB_REPOSITORY_URL)
const region = process.env.CODEBUILD_PROJECT_REGION
const codeBuildStatusToGitHubStatus = require('./lib/codebuild-status-to-github-status').codeBuildStatusToGitHubStatus

github.authenticate({type:'oauth', token: process.env.GITHUB_TOKEN})

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    //console.log('Received event:', JSON.stringify(event, null, 2))
    console.log(`Build status: ${event.buildStatus}, Commit hash: ${event.sourceVersion}`)

    const status = codeBuildStatusToGitHubStatus(event.buildStatus)
    if (status.state === '') {
        callback(status.errorMessage)
    }

    github.repos.createStatus({
        owner: repo.owner,
        repo: repo.name,
        sha: event.sourceVersion,
        state: status.state,
        target_url: `https://${region}.console.aws.amazon.com/codebuild/home?region=${region}#/builds/${event.id}/view/new`,
        context: 'codebuild',
        description: status.msg
    }).then((data) => {
        callback(null, data)
    }).catch((err) => {
        console.log(err, err.stack)
        callback(err)
    })
}
