//------------------------------------------------------------------------------
// Rule Definition
//
// This rule ensures we don't reference `goog.require` anywhere.
//------------------------------------------------------------------------------

module.exports = function (context) {
    return {
        "MemberExpression": function (node) {
            if (node.object.type === 'Identifier' &&
                node.object.name === 'goog' &&
                node.property.type === 'Identifier' &&
                node.property.name === 'require') {

                context.report(node, context.getSource(node.parent) + ' must be removed');
            }
        }
    };
};
