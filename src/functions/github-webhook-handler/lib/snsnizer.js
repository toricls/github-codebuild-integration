'use strict'

// Returns a SNS-styled JSON obj which has `jsonToMessageBody` as `Message` value.
// This method expects to be used as a unit-test helper.
exports.snsnize = (jsonToMessageBody) => {
    return {
        Records: [{
            Sns: {
                Message: JSON.stringify(jsonToMessageBody)
            }
        }]
    }
}
