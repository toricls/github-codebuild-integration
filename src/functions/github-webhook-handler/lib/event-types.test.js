'use strict'

let assert = require('assert')

let pushedEvent = require('../../../../test/fixtures/pushed')
let prCreatedEvent = require('../../../../test/fixtures/pr-created')

let snsnize = require('./snsnizer').snsnize
let ghEventType = require('./event-types').ghEventType

describe('event-types', function() {
    describe('ghEventType', function() {
        it('should return "push" when the event is pushed event', function() {
            const message = JSON.parse(snsnize(pushedEvent).Records[0].Sns.Message)
            assert.equal('push', ghEventType(message))
        })
        it('should return "pr" when the event is pr-created event', function() {
            const message = JSON.parse(snsnize(prCreatedEvent).Records[0].Sns.Message)
            assert.equal('pr', ghEventType(message))
        })
    })
})
