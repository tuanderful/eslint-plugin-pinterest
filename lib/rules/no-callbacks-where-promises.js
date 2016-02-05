//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var promiseFunctionAllowedArguments = {
    'loadModule': 1,
    'render': 0
};
var promiseFunctionNames = Object.keys(promiseFunctionAllowedArguments);

module.exports = function (context) {

    return {
        "CallExpression": function (node) {
            if (node.callee.type !== 'MemberExpression' ||
                    node.callee.property.type !== 'Identifier' ||
                    promiseFunctionNames.indexOf(node.callee.property.name) === -1 ||
                    promiseFunctionAllowedArguments[node.callee.property.name] ===
                        (node.arguments ? node.arguments.length : 0)) {
                return;
            }

            context.report(node, node.callee.property.name + '() only takes one argument (no callbacks) and returns a promise: ' + context.getSource(node));
        }
    };

};
