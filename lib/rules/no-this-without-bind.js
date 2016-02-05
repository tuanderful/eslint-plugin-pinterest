//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
var _ = require('lodash');

var allowedParentIdentifiers = [
    /^topicToHandlerMap$/,
    /^droppable$/,
    /^jQuery$/,
    /^listen$/,
    /^childListen$/,
    /^grunt$/,
    /^each$/,
    /^this$/,
    /FromJsContent$/,
    /^\$/
];

module.exports = function(context) {
    var fnStack = [];
    var boundFunctions = [];
    var safeExpressions = [];

    var getExpression = function(node) {
        while (node.parent && ['BlockStatement', 'VariableDeclaration',
                'Program', 'FunctionExpression'
            ].indexOf(node.parent.type) === -1) {
            node = node.parent;
        }
        return node;
    };

    var isWrapper = function(node) {
        if (node.parent &&
            node.parent.type === 'CallExpression' &&
            node.parent.callee.type === 'MemberExpression' && ['call',
                'apply'
            ].indexOf(node.parent.callee.property.name) !== -1 &&
            node.parent.arguments &&
            node.parent.arguments.length &&
            node.parent.arguments[0] === node) {
            return true;
        }
        return false;
    };

    var isSafe = function(node) {
        var expression = getExpression(node);
        if (expression === node) {
            return false;
        }

        return safeExpressions.indexOf(expression) !== -1;
    };

    return {
        "Identifier": function(node) {
            // filter out identifiers which may be in a statement causing it to
            // be safe for `this` without binding
            if (_.find(allowedParentIdentifiers, function(filter) {
                    return node.name.match(filter);
                })) {
                var expression = getExpression(node);
                safeExpressions.push(expression);
            }
        },

        "CallExpression": function(node) {
            if (node.callee.type !== 'MemberExpression' ||
                node.callee.property.type !== 'Identifier' ||
                node.callee.property.name !== 'bind' ||
                node.callee.object.type !== 'FunctionExpression') {
                return false;
            }

            boundFunctions.push(node.callee.object);
        },

        "FunctionExpression": function(node) {
            // ignore self executing functions
            if (node.parent && node.parent.type === 'CallExpression' &&
                node.parent.callee === node) {
                return;
            }

            fnStack.push({
                node: node,
                isBound: fnStack.length === 0 ||
                    (node.parent && node.parent.type === 'ReturnStatement') ?
                    true : boundFunctions.indexOf(node) !== -1
            });
        },

        "FunctionExpression:exit": function(node) {
            // ignore self executing functions
            if (node.parent && node.parent.type === 'CallExpression' &&
                    node.parent.callee === node) {
                return;
            }

            fnStack.pop();
        },

        "ThisExpression": function(node) {
            // ignore any .apply() and .call() functions or jquery functions
            if (isWrapper(node) || isSafe(node)) {
                return;
            }

            for (var i = 0; i < fnStack.length; i++) {
                if (!fnStack[i].isBound) {
                    if (isSafe(fnStack[i].node)) {
                        // jquery nodes mean all subsequent functions are implicitly
                        // bound
                        continue;
                    }

                    context.report(node,
                        '"this" may only be referenced in bound functions: ' +
                        context.getSource(node.parent));

                    return;
                }
            }

            safeExpressions.push(getExpression(node));
        }
    };

};
