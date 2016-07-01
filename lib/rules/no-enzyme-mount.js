//------------------------------------------------------------------------------
// Rule Definition
//
// This rule ensures we don't use enzyme.mount, preferring integrations tests
// for any DOM mounted testing
//------------------------------------------------------------------------------

var MESSAGE = ' should use enzyme.shallow. If your component must be mounted, try integration tests.';

module.exports = function (context) {
    return {
        "MemberExpression": function (node) {
            if (node.object.type === 'Identifier' &&
                node.object.name === 'enzyme' &&
                node.property.type === 'Identifier' &&
                node.property.name === 'mount') {
                context.report(node, context.getSource(node.parent) + MESSAGE);
            }
        }
    };
};