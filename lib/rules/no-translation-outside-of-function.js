//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {
    var functionStack = [];

    return {
        "FunctionExpression": function(node) {
            functionStack.push(node);
        },

        "FunctionExpression:exit": function(node) {
            functionStack.pop();
        },

        "CallExpression": function (node) {
            if (functionStack.length ||
                    node.callee.type !== 'MemberExpression' ||
                    node.callee.object.type !== 'Identifier' ||
                    node.callee.object.name !== 'i18n' ||
                    node.callee.property.type !== 'Identifier' ||
                    node.callee.property.name !== '_') {
                return;
            }

            context.report(node, 'P.i18n._() may only be called from inside a function after the locale has been loaded: ' + context.getSource(node));
        }
    };

};
