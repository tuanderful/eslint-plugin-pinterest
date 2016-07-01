var rule = require('../no-enzyme-mount');
var RuleTester = require('eslint').RuleTester;
var readFileSync = require('fs').readFileSync;
var resolve = require('path').resolve;
var parserOptions = {
    sourceType: "module",
    ecmaVersion: 6,
    ecmaFeatures: {
        jsx: true
    }
};

var ruleTester = new RuleTester();
ruleTester.run('no-enzyme-mount', rule, {
    valid: ['valid.js'].map(function(path) {
        return {
            parserOptions: parserOptions,
            code: readFileSync(resolve(__dirname, './no-enzyme-mount/', path), 'utf8'),
        };
    }),
    invalid: ['invalid.js'].map(function(path) {
        return {
            parserOptions: parserOptions,
            code: readFileSync(resolve(__dirname, './no-enzyme-mount/', path), 'utf8'),
            errors: [
                { ruleId: 'no-enzyme-mount' }
            ],
        };
    }),
});
