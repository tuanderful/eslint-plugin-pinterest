//------------------------------------------------------------------------------
// Rule Definition
//
// This rule ensures that only non-template strings are used in i18n._
// These should fail: i18n._(someFunc() || `test${foo}`)
// These should pass: i18n._('test' || "test" || `test`)
//------------------------------------------------------------------------------

function isI18n(node) {
    return (
        node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === 'i18n' &&
        node.property.type === 'Identifier' &&
        node.property.name === '_'
    );
}

function isValidArgument(arg) {
    return arg && (
        (arg.type === 'Literal' && typeof arg.value === 'string') ||
        (arg.type === 'TemplateLiteral' && arg.expressions.length === 0)
    );
}

module.exports = function (context) {
    return {
        "CallExpression": function (node) {
            if (isI18n(node.callee) && !isValidArgument(node.arguments[0])) {
                context.report(node, 'Do not use dynamic variables in i18n._()');
            }
        }
    };
};
