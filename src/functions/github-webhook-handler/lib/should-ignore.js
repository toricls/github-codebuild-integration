'use strict'

// eventType is a string from lib/event-types.
exports.shouldIgnore = (eventType, eventAction = '', branchName = '', commitMessage = '') => {
    // Temporarily disabled
    if (process.env.DO_NOT_RUN+'' === 'true') {
        console.log('`DO_NOT_RUN` option is enabled. We ignore the webhook event this time.')
        return true
    }

    const target = process.env.GITHUB_TARGET_RESOURCE
    // Ignore if the type of this event is not target
    if (target !== eventType) {
        console.log(`${eventType} is not configured as a target. configured target is: ${target}`)
        return true
    }
    // Ignore if it is a PR closing event
    if (eventType === 'pr' && eventAction === 'closed') {
        console.log('Closed PR.')
        return true
    }
    // Ignore if the commit message includes specific text
    const ignoreKeyword = process.env.BUILD_SKIPPED_BY
    if (eventType === 'push' && commitMessage.indexOf(ignoreKeyword) !== -1) {
        console.log(`The push is ignored because the message of the head commit includes the keyword "${ignoreKeyword}".`)
        return true
    }
    // Ignore specific branches
    if (eventType === 'push' && process.env.GITHUB_IGNORE_BRANCH_REGEX.trim() !== '') {
        let re = new RegExp('^' + process.env.GITHUB_IGNORE_BRANCH_REGEX.trim() + '$', 'g')
        if (re.test(branchName)) {
            console.log(`Branch "${branchName}" is ignored by configuration.`)
            return true
        }
    }
    return false
}
