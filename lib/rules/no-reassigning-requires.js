//------------------------------------------------------------------------------
// Rule Definition
// This rule disallows reassigning variable names that are already assigned to
// require statements.
//
// For example, if we import Foo.js and assign it to foo:
//     var foo = require('./Foo.js');
//
// We may not reuse `foo` as a variable name, or as the name of a function param.
//     function someMethod(foo) {}
//
//     var someMethod = function(foo) {};
//
//     function bar() {
//         var foo = '';
//     }
//------------------------------------------------------------------------------

module.exports = function (context) {
    // Map of variables initialized to require statements.
    var requireVariables = {};

    // Map of non-require variable declarations, and function params
    var declaredVariables = {};

    function _addVariableToMap(name, node) {
        if (!Array.isArray(declaredVariables[name])) {
            declaredVariables[name] = [];
        }
        declaredVariables[name].push(node);
    }

    // Since we cannot reliably capture all import variables if we traverse the
    // AST in order, we need to accumulate data and process it all once traversal
    // is complete.

    return {
        // When we visit a variable declaration, either add it as a require
        // variable, or add it to our list of other variable declarations.
        "VariableDeclarator": function(node) {
            if (node.init && node.init.type === 'CallExpression' &&
                node.init.callee.type === 'Identifier' &&
                node.init.callee.name === 'require') {

                requireVariables[node.id.name] = true;
            } else {
                _addVariableToMap(node.id.name, node);
            }
        },
        "FunctionExpression": function(node) {
            node.params.forEach(function(param) {
                _addVariableToMap(param.name, node);
            });
        },
        "FunctionDeclaration": function(node) {
            node.params.forEach(function(param) {
                _addVariableToMap(param.name, node);
            });
        },

        // Check all the variable names initialized to require statements against
        // all variable declarations and function parameters.
        "Program:exit": function(node) {
            Object.keys(requireVariables).forEach(function(reqVar) {
                if (declaredVariables.hasOwnProperty(reqVar)) {
                    declaredVariables[reqVar].forEach(function(declaredVarNode) {
                        var variableType = declaredVarNode.type === 'VariableDeclarator' ?
                            'variable' : 'parameter';

                        context.report(declaredVarNode, reqVar +
                            ' is a variable name assigned to an import; use a different ' +
                            variableType + ' name. ');
                    });
                }
            });
        }
    };
};
