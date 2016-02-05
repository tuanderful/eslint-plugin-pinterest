//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    return {
        "MemberExpression": function (node) {
            if (node.object.type === 'ThisExpression' ||
                (node.object.type === 'Identifier' && node.object.name === 'self') ||
                node.property.type !== 'Identifier' ||
                node.property.name !== '$el') {
                return;
            }

            context.report(node, '$el may only be referenced by its own module: ' + context.getSource(node));
        }
    };

};
