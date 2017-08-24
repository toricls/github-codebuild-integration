'use strict'

let assert = require('assert')

let pushedEvent = JSON.parse(require('../../../../test/fixtures/pushed').Records[0].Sns.Message)
let prCreatedEvent = JSON.parse(require('../../../../test/fixtures/pr-created').Records[0].Sns.Message)

let ghEventType = require('./event-types').ghEventType

describe('event-types', function() {
    describe('ghEventType', function() {
        it('should return "push" when the event is pushed event', function() {
            assert.equal('push', ghEventType(pushedEvent))
        })
        it('should return "pr" when the event is pr-created event', function() {
            assert.equal('pr', ghEventType(prCreatedEvent))
        })
    })
})
