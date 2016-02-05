var _ = require('lodash');


module.exports = function (context) {
    var variableStack = [{
        defined: [
                'alert',
                'arguments',
                'Buffer',
                'Array',
                'clearInterval',
                'clearTimeout',
                'console',
                'Cookie',
                'Date',
                'decodeURIComponent',
                'document',
                'encodeURI',
                'encodeURIComponent',
                'Error',
                'FileReader',
                'FormData',
                'Function',
                'Image',
                'Infinity',
                'isNaN',
                'JSON',
                'Math',
                'navigator',
                'Notification',
                'null',
                'Number',
                'Object',
                'parseFloat',
                'parseInt',
                'printStackTrace',
                'Promise',
                'RegExp',
                'screen',
                'ServiceWorkerRegistration',
                'setInterval',
                'setTimeout',
                'String',
                'undefined',
                'unescape',
                'window',
                'XMLHttpRequest',
            ].concat([
                // node stuff
                'require',
                'process',
                '__dirname',
                '__filename',
                'module',
                'exports',
                'global',
            ]).concat([
                // Pinterest globals
                'P',
                'Pc',
                'Pw',
            ].concat([
                // testing
                'assert',
                'it',
                'xit',
                'beforeEach',
                'afterEach',
                'describe',
                'expect',
                'sinon',
            ]).concat([
                'chrome',   // webapp/app/common/lib/BrowserExtension.js
                'FB',       // webapp/app/common/lib/Fb.js

                'google',   // TODO(tuan): externally loaded lib for google visualizations

                // external stuff
                // TODO(tuanhuynh/chris): Migate away from globals to expressing/consuming
                // these things through CommonJS.
                '$',
                '_',
                'jQuery',
                'nunjucks',
                'Backbone',
                'hljs',
                'FastClick',
                'qq',
                'qq',
                'L',
                'Modernizr',
                '$script',
                'c3',
                'd3',
                'IntlPolyfill',
                'parseUri',
                'Papa',
                'Yozio'
            ])),
        referenced: [],
        required: []
    }];

    var validateRef = function (ref) {
        for (var i = 0; i < variableStack.length; i++) {
            // Check if reference is defined in current stack
            if (variableStack[i].defined.indexOf(ref) !== -1) {
                return true;
            }
        }

        // Base error message
        var errorMessage = ref + ' referenced but never defined in ' + context.getFilename() + '\n';

        throw new Error(errorMessage);
    };

    var getCurrentScope = function() {
        return variableStack[variableStack.length - 1];
    };

    var pushFunction = function (node) {
        if (node.id && node.id.name) {
            getCurrentScope().defined.push(node.id.name);
        }
        variableStack.push({
            defined: node.params.map(function (param){return param.name;}),
            referenced: [],
            required: []
        });
    };

    var popFunction = function (node) {
        var curr = getCurrentScope();
        _.chain(curr.referenced).uniq().forEach(function (ref) {
            validateRef(ref);
        });
        variableStack.pop();
    };

    return {
        'CallExpression': function(node) {
            if (node.callee && node.callee.name === 'require') {
                if(node.arguments.length === 1) {
                    getCurrentScope().required.push(node.arguments[0].value);
                }
            }
        },

        'Program': function (node) {
            //console.log('---' + context.getFilename());
        },

        'Identifier': function (node) {
            if (node.parent.type === 'Property' &&
                node.parent.value !== node) {

                return;
            }

            if (node.parent &&
                node.parent.type === 'MemberExpression' &&
                node.parent.object !== node) {

                return;
            }

            getCurrentScope().referenced.push(node.name);
        },

        'VariableDeclarator': function (node) {
            if (node.id.type === 'Identifier') {
                getCurrentScope().defined.push(node.id.name);
            }
        },

        'CatchClause': function (node) {
            if (node.param && node.param.name) {
                getCurrentScope().defined.push(node.param.name);
            }
        },

        'FunctionDeclaration': function (node) {
            pushFunction(node);
        },

        'FunctionDeclaration:exit': function (node) {
            popFunction(node);
        },

        'FunctionExpression': function (node) {
            pushFunction(node);
        },

        'FunctionExpression:exit': function (node) {
            popFunction(node);
        },
    };
};
