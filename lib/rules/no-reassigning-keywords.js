//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var reservedNames = ['undefined', 'null', 'Array', 'Object', 'Function', 'Pc', 'Pw', 'this'];

module.exports = function (context) {

    return {
        "AssignmentExpression": function (node) {
            if (node.left.type !== 'Identifier' ||
                reservedNames.indexOf(node.left.name) === -1) {
                return;
            }

            context.report(node, 'Unsafe variable reassignment: ' + context.getSource(node));
        },

        "VariableDeclarator": function (node) {
            if (reservedNames.indexOf(node.id.name) === -1) {
                return;
            }

            context.report(node, 'Unsafe variable reassignment: ' + context.getSource(node));
        }
    };

};
