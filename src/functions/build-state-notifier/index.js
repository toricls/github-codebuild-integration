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
    const sha = event.detail['additional-information']['source-version']
    const buildId = event.detail['build-id'].split('build/')[1]
    console.log(`Build status: ${event.detail['build-status']}, Commit hash: ${sha}`)

    const status = codeBuildStatusToGitHubStatus(event.detail['build-status'])
    if (status.state === '') {
        callback(status.errorMessage)
    }

    github.repos.createStatus({
        owner: repo.owner,
        repo: repo.name,
        sha: sha,
        state: status.state,
        target_url: `https://${region}.console.aws.amazon.com/codebuild/home?region=${region}#/builds/${buildId}/view/new`,
        context: 'codebuild',
        description: status.message
    }).then((data) => {
        callback(null, data)
    }).catch((err) => {
        console.log(err, err.stack)
        callback(err)
    })
}
