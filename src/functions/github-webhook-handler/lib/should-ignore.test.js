'use strict'

let assert = require('assert')

let shouldIgnore = require('./should-ignore').shouldIgnore

describe('should-ignore', () => {
    describe('shouldIgnore', () => {
        it('should ignore the event if DO_NOT_RUN is enabled', () => {
            process.env.DO_NOT_RUN = true
            assert.equal(true, shouldIgnore())
        })
        it('should ignore the push event if GITHUB_TARGET_RESOURCE is pr', () => {
            process.env.GITHUB_TARGET_RESOURCE = 'pr'
            assert.equal(true, shouldIgnore('push'))
        })
        it('should ignore the pr event if GITHUB_TARGET_RESOURCE is push', () => {
            process.env.GITHUB_TARGET_RESOURCE = 'push'
            assert.equal(true, shouldIgnore('pr'))
        })
        it('should ignore the pr event if it is a closed event', () => {
            process.env.GITHUB_TARGET_RESOURCE = 'pr'
            assert.equal(true, shouldIgnore('pr', 'closed'))
        })
        it('should ignore the push event if the branch is ignored by GITHUB_IGNORE_BRANCH_REGEX', () => {
            process.env.GITHUB_TARGET_RESOURCE = 'push'
            process.env.GITHUB_IGNORE_BRANCH_REGEX = 'wip.*'
            assert.equal(true, shouldIgnore('push', '', 'wip-branch'))
        })
        it('should ignore the push event if the message of the head commit has the keyword to be ignored', () => {
            process.env.GITHUB_TARGET_RESOURCE = 'push'
            process.env.BUILD_SKIPPED_BY = 'skip ci'
            assert.equal(true, shouldIgnore('push', '', 'master', '[skip ci] This commit should be ignored'))
        })
        it('should NOT ignore the push event if the branch is NOT ignored by GITHUB_IGNORE_BRANCH_REGEX', () => {
            process.env.GITHUB_TARGET_RESOURCE = 'push'
            process.env.GITHUB_IGNORE_BRANCH_REGEX = 'wip.*'
            assert.equal(false, shouldIgnore('push', '', 'master'))
        })
        afterEach(() => {
            delete process.env.DO_NOT_RUN
            delete process.env.GITHUB_TARGET_RESOURCE
            delete process.env.GITHUB_IGNORE_BRANCH_REGEX
        })
    })
})
