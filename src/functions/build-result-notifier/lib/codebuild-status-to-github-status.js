'use strict'

exports.codeBuildStatusToGitHubStatus = (codeBuildStatus) => {
    let state = ''
    var msg = ''
    var errMsg = ''
    switch(codeBuildStatus) {
    case 'SUCCEEDED':
        state = 'success'
        msg = 'Your tests passed on AWS CodeBuild!'
        break
    case 'FAILED':
        state = 'failure'
        msg = 'Your tests failed on AWS CodeBuild'
        break
    case 'IN_PROGRESS':
        state = 'pending'
        msg = 'AWS CodeBuild is running your tests...'
        break
    case 'FAULT':
    case 'STOPPED':
    case 'TIMED_OUT':
        state = 'error'
        msg = 'Something wrong happened on AWS CodeBuild'
        break
    default:
        errMsg = `Unknown CodeBuilg buildStatus: ${codeBuildStatus}`
        console.log(errMsg)
    }
    return {
        state: state,
        message: msg,
        errorMessage: errMsg
    }
}