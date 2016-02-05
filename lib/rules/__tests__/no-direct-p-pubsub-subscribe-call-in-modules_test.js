"use strict";

var rule = require('../no-direct-p-pubsub-subscribe-call-in-modules'),
    RuleTester = require('eslint').RuleTester,
    readFileSync = require('fs').readFileSync,
    resolve = require('path').resolve;

var ruleTester = new RuleTester();
ruleTester.run('no-direct-p-pubsub-subscribe-call-in-modules', rule, {
    valid: ['ideal.js'].map(function(path) {
        return readFileSync(resolve(__dirname, './no-direct-p-pubsub-subscribe-call-in-modules/valid', path), 'utf-8');
    }),
    invalid: ['0.js'].map(function(path) {
        return {
            code: readFileSync(resolve(__dirname, './no-direct-p-pubsub-subscribe-call-in-modules/invalid', path), 'utf-8'),
            errors: [
                {ruleId: 'no-direct-p-pubsub-subscribe-call-in-modules'}
            ]
        }
    }),
});
