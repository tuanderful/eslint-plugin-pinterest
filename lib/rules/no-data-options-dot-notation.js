var forcedNames = ['data', 'options', 'extraData'];
var allowedMembers = ['length', 'getChildById', 'slice'];

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {
    var isNode = false;

    return {
        "Identifier": function (node) {
            if (isNode) {
                return;
            }

            if (node.name === 'exports' &&
                    node.parent &&
                    node.parent.type === 'MemberExpression' &&
                    node.parent.object.type === 'Identifier' &&
                    node.parent.object.name === 'module') {
                isNode = true;
            } else if (node.name === 'require' &&
                    node.parent &&
                    node.parent.type === 'CallExpression' &&
                    node.parent.callee === node) {
                isNode = true;
            }
        },

        "MemberExpression": function (node) {
            if (node.computed || isNode) {
                return;
            }

            if (node.object.type === 'Identifier' &&
                forcedNames.indexOf(node.object.name) !== -1 &&
                allowedMembers.indexOf(node.property.name) === -1) {
                context.report(node, node.object.name +
                    '.' + node.property.name +
                    ' should be written as ' +
                    node.object.name + '[\'' + node.property.name + '\']');

            } else if (node.object.type === 'MemberExpression' &&
                node.object.object.type === 'ThisExpression' &&
                node.object.property.type === 'Identifier' &&
                forcedNames.indexOf(node.object.property.name) !== -1 &&
                allowedMembers.indexOf(node.property.name) === -1) {
                // this.data.key
                context.report(node, 'this.' + node.object.property.name +
                    '.' + node.property.name +
                    ' should be written as this.' +
                    node.object.property.name +
                    '[\'' + node.property.name + '\']');

            }
        }
    };
};
