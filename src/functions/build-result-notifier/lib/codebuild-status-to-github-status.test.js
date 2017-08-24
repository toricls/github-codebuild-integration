'use strict'

let assert = require('assert')

let codeBuildStatusToGitHubStatus = require('./codebuild-status-to-github-status').codeBuildStatusToGitHubStatus

describe('should-ignore', () => {
    describe('shouldIgnore', () => {
        it('should return success status if CodeBuild has done without any problem', () => {
            var result = codeBuildStatusToGitHubStatus('SUCCEEDED')
            assert.equal('success', result.state)
        })
        it('should return failure status if CodeBuild has been marked as failed', () => {
            var result = codeBuildStatusToGitHubStatus('FAILED')
            assert.equal('failure', result.state)
        })
        it('should return pending status if CodeBuild is running', () => {
            var result = codeBuildStatusToGitHubStatus('IN_PROGRESS')
            assert.equal('pending', result.state)
        })
        it('should return error status if something wrong has happen on CodeBuild', () => {
            var result = codeBuildStatusToGitHubStatus('FAULT')
            assert.equal('error', result.state)
        })
        it('should return error status if CodeBuild has stopped', () => {
            var result = codeBuildStatusToGitHubStatus('STOPPED')
            assert.equal('error', result.state)
        })
        it('should return error status if CodeBuild has timed out', () => {
            var result = codeBuildStatusToGitHubStatus('TIMED_OUT')
            assert.equal('error', result.state)
        })
        it('should return error message if the CodeBuild status is unknown', () => {
            var result = codeBuildStatusToGitHubStatus('UNKNOWN_VALUE')
            assert.equal('', result.state)
            assert.equal('', result.message)
            assert.equal('Unknown CodeBuilg buildStatus: UNKNOWN_VALUE', result.errorMessage)
        })
    })
})
