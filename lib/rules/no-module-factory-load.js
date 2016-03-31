//------------------------------------------------------------------------------
// Rule Definition
//
// This rule ensures we don't dynamically initialize modules using the
// moduleFactory.load function
//------------------------------------------------------------------------------

module.exports = function (context) {
    var moduleFactoryVarName;

    return {
        // Look for require calls with paths containing moduleFactory.js
        // Remember the variable name
        "VariableDeclarator": function(node) {
            // looking for require imports of moduleFactory
            if (node.init && node.init.type === 'CallExpression' &&
                node.init.callee.type === 'Identifier' &&
                node.init.callee.name === 'require') {

                if (node.init.arguments[0].value.includes('moduleFactory.js')) {
                    moduleFactoryVarName = node.id.name;
                }
            }
        },

        "CallExpression": function(node) {
            // calling method on moduleFactory
            if (node.callee.object &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === moduleFactoryVarName) {

                // calling moduleFactory.load
                if (node.callee.property &&
                    node.callee.property.type === 'Identifier' &&
                    node.callee.property.name === 'load') {

                    context.report(node.callee, 'moduleFactory.load called. Construct the module directly instead');
                }
            }
        }
    };
};
