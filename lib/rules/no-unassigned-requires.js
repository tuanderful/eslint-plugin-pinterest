//------------------------------------------------------------------------------
// Rule Definition
// This rule ensures all require statements are assigned to local variables.
//
// This will fail:
//   require('Foo.js')
//
// This is devs should do:
//   var Foo = require('Foo.js');
//
// This linter stops checking once it encounters an expression statement with a
// comment indicating `Template dependencies` have started, and is predicated
// on the assumption that all module dependencies are defined before template
// dependencies.
//------------------------------------------------------------------------------
var path = require('path');

module.exports = function (context) {

    /**
     * Return true if parent (or an ancestor) is an assignment expression or
     * variable declarator.
     */
    function _hasAssignmentAncestor(node) {
        switch (node.parent.type) {
            case 'ExpressionStatement':
                return false;

            case 'VariableDeclarator':
                // Ex var foo = require('foo')
                return true;

            case 'AssignmentExpression':
                // Ex: window.foo = require('foo')
                return true;

            case 'MemberExpression':
                return _hasAssignmentAncestor(node.parent);

            case 'CallExpression':
                // Ex: require('foo')(params)
                // ignore for now
                return _hasAssignmentAncestor(node.parent);

            case 'ReturnStatement':
                // Ex: return require('foo')
                // ignore for now
                return true;

            default:
                console.log(node);
                throw new Error('Unhandled node type checking for assigned require statements.');
        }
    }

    var _startDefiningTemplates = false;

    return {
        "CallExpression": function(node) {
            if (!_startDefiningTemplates &&
                node.callee.type === 'Identifier' && node.callee.name === 'require') {

                if (!_hasAssignmentAncestor(node)) {
                    var requirePath = node.arguments[0].value;
                    var moduleName = path.parse(requirePath).name;
                    context.report(node, 'require statement not assigned to variable. Assign with:\n ' +
                        `      var ${moduleName} = require('${requirePath}')`
                    );
                }
            }
        },

        // We look for leadingComments when traversing ExpressionStatement nodes
        // rather than simply traversing LineComment nodes. If we traverse
        // LineComment nodes, the flag is flipped too early, leading to off-by-one errors.
        "ExpressionStatement": function(node) {
            if (node.leadingComments &&
                node.leadingComments[0].value === ' Template dependencies' ) {

                _startDefiningTemplates = true;
            }
        }
    };
};
