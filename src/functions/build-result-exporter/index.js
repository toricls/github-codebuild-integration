'use strict'

const AWS = require('aws-sdk'),
    codebuild = new AWS.CodeBuild()

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    //console.log('Received event:', JSON.stringify(event, null, 2))
    const params = {
        ids: [event.id]
    }
    codebuild.batchGetBuilds(params, function(err, data) {
        if (err) {
            console.log(err, err.stack)
            context.fail(err)
            callback(err)
        } else {
            //console.log('Build: ', JSON.stringify(data.builds, null, 2))
            callback(null, data.builds[0])
        }
    })
}
