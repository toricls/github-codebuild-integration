'use strict'

const GitHubApi = require('github'),
    github = new GitHubApi({version: '3.0.0'})
const response = require('cfn-response')
const ghUrl = require('parse-github-url'),
    repo = ghUrl(process.env.GITHUB_REPOSITORY_URL)

github.authenticate({type:'oauth', token: process.env.GITHUB_TOKEN})

function getTargetEvents() {
    // Convert github-codebuild-integration style to GitHub event style
    const target = process.env.GITHUB_TARGET_RESOURCE
    let result = []
    switch(target) {
    case 'pr':
        result.push('pull_request')
        break
    case 'push':
        result.push('push')
        break
    }
    if (result.length == 0) {
        return ['push']
    }
    return result
}

function hookParameters(requestType, id) {
    switch (requestType) {
    case 'Create':
        return {
            owner: repo.owner,
            repo: repo.name,
            name: 'amazonsns',
            config: {
                'aws_key': process.env.SNS_ACCESS_KEY_ID,
                'aws_secret': process.env.SNS_SECRET_ACCESS_KEY,
                'sns_topic': process.env.SNS_TOPIC,
                'sns_region': process.env.SNS_REGION
            },
            events: getTargetEvents()
        }
    case 'Update':
        return {
            owner: repo.owner,
            repo: repo.name,
            id: id,
            name: 'amazonsns',
            config: {
                'aws_key': process.env.SNS_ACCESS_KEY_ID,
                'aws_secret': process.env.SNS_SECRET_ACCESS_KEY,
                'sns_topic': process.env.SNS_TOPIC,
                'sns_region': process.env.SNS_REGION
            },
            events: getTargetEvents()
        }
    case 'Delete':
        return {
            owner: repo.owner,
            repo: repo.name,
            id: id
        }
    }
}

exports.handler = (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2))
    Promise.resolve().then(() => {
        const params = hookParameters(event.RequestType, event.PhysicalResourceId)
        console.log('Sending params to GitHub:', JSON.stringify(params, null, 2))
        switch (event.RequestType) {
        case 'Create':
            return new Promise((resolve, reject) => {
                github.repos.createHook(params, (err, result) => {
                    err ? reject(err) : resolve(result)
                })
            })
        case 'Update':
            return new Promise((resolve, reject) => {
                github.repos.editHook(params, (err, result) => {
                    err ? reject(err) : resolve(result)
                })
            })
        case 'Delete':
            return new Promise((resolve, reject) => {
                github.repos.deleteHook(params, (err, result) => {
                    err ? reject(err) : resolve(result)
                })
            })
        default:
            throw new Error(`Unkown RequestType: '${event.RequestType}'`)
        }
    }).then((res) => {
        const physicalResourceId = res.data.id ? res.data.id : 'unknown-hook-id'
        if (!res.data.id) console.log('Received data from GitHub:', JSON.stringify(res, null, 2))
        const responseData = { HookId: physicalResourceId }
        response.send(event, context, response.SUCCESS, responseData, physicalResourceId+'') // physicalResourceId should be string
    }).catch((err) => {
        const responseData = { Error: err.toString() }
        response.send(event, context, response.FAILED, responseData)
    })
}
