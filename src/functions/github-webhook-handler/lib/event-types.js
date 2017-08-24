'use strict'

// ghEvent is a JSON object from GitHub webhook.
exports.ghEventType = (ghEvent) => {
    if ('pull_request' in ghEvent) return 'pr'
    if ('commits' in ghEvent) return 'push'
    console.log('Unknown event found in: ', JSON.stringify(ghEvent, null, 2))
}
