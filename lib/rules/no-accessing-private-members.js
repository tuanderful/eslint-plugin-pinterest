//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var ALLOWED_PARENTS = ['window', '$'];

module.exports = function (context) {
    return {
        "MemberExpression": function (node) {
            if (node.object.type === 'ThisExpression' ||
                    node.property.type !== 'Identifier' ||
                    node.property.name === '_' ||
                    node.property.name.indexOf('_') !== 0) {
                return;
            } else if (node.object.type === 'Identifier' &&
                    ALLOWED_PARENTS.indexOf(node.object.name) !== -1) {
                return;
            }

            context.report(node, 'Members prefixed with "_" are considered private and may only be accessed via "this": ' + context.getSource(node));
        }
    };

};
