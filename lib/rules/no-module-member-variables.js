//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    return {
        "MemberExpression": function (node) {
            if (node.object.type !== 'ThisExpression' ||
                node.property.type !== 'Identifier' ||
                node.property.name === 'state') {
                return true;
            }

            while (true) {
                var parent = node.parent;
                if (!parent) {
                    break;
                }

                if (['Function', 'FunctionExpression'].indexOf(parent.type) !== -1) {
                    // options are being referenced, this is okay
                    break;
                }
                if (parent.type === 'AssignmentExpression' && parent.left === node) {
                    context.report(node, 'Only mutations to this.state are permitted: ' + context.getSource(parent));
                }
                node = parent;
            }
        }
    };
};
