var rule = require('../no-dynamic-i18n-calls');
var RuleTester = require('eslint').RuleTester;
var readFileSync = require('fs').readFileSync;
var resolve = require('path').resolve;
var parserOptions = {
    sourceType: "module",
    ecmaVersion: 6,
};

var ruleTester = new RuleTester();
ruleTester.run('no-dynamic-i18n-calls', rule, {
    valid: ['valid.js'].map(function(path) {
        return {
            parserOptions: parserOptions,
            code: readFileSync(resolve(__dirname, './no-dynamic-i18n-calls/', path), 'utf8'),
        };
    }),
    invalid: ['invalid.js'].map(function(path) {
        return {
            parserOptions: parserOptions,
            code: readFileSync(resolve(__dirname, './no-dynamic-i18n-calls/', path), 'utf8'),
            errors: [
                { ruleId: 'no-dynamic-i18n-calls', message: 'The first argument in i18n._() must be a raw string.' },
                { ruleId: 'no-dynamic-i18n-calls', message: 'The first argument in i18n._() must be a raw string.' },
                { ruleId: 'no-dynamic-i18n-calls', message: 'The first argument in i18n._() must be a raw string.' },
                { ruleId: 'no-dynamic-i18n-calls', message: 'The <context> argument in i18n._() must be a raw string.' },
                { ruleId: 'no-dynamic-i18n-calls', message: 'The <context> argument in i18n._() must be a raw string.' },
                { ruleId: 'no-dynamic-i18n-calls', message: 'The <plural> argument in i18n._() must be a raw string.' },
                { ruleId: 'no-dynamic-i18n-calls', message: 'The <plural> argument in i18n._() must be a raw string.' },
            ],
        };
    }),
});
