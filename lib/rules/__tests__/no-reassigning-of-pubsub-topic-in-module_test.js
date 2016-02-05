"use strict";

var rule = require('../no-reassigning-of-pubsub-topic-in-module'),
    RuleTester = require('eslint').RuleTester,
    readFileSync = require('fs').readFileSync,
    resolve = require('path').resolve;

var ruleTester = new RuleTester();
ruleTester.run('no-reassigning-of-pubsub-topic-in-module', rule, {
    valid: ['3_1.js', '3_scoping.js', '5_1.js', '5_2.js', 'ideal.js'].map(function(path) {
        return readFileSync(resolve(__dirname, './no-reassigning-of-pubsub-topic-in-module/valid', path), 'utf-8');
    }),
    invalid: ['0.js', '1.js', '2.js', '3_1.js', '3_scoping.js', '4.js', '5_1.js',
              '5_2.js', '6.js', '7.js'].map(function(path) {
        return {
            code: readFileSync(resolve(__dirname, './no-reassigning-of-pubsub-topic-in-module/invalid', path), 'utf-8'),
            errors: [
                {ruleId: 'no-reassigning-of-pubsub-topic-in-module'}
            ]
        }
    }),
});
