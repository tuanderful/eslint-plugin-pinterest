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

function isMultilineBinary(arg) {
  return arg.operator === '+' && isString(arg.left) && isString(arg.right);
}

function isString(arg) {
    return arg && (
        (arg.type === 'Literal' && typeof arg.value === 'string') ||
        (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) ||
        (arg.type === 'BinaryExpression' && isMultilineBinary(arg))
    );
}

function validateArgs(args) {
  const len = args.length;
  if (!isString(args[0])) {
    return 'The first argument in i18n._() must be a raw string.';
  }
  if (len === 2 && !isString(args[1])) {
    return 'The <context> argument in i18n._() must be a raw string.';
  }
  if ((len === 3 || len === 4) && !isString(args[1])) {
    return 'The <plural> argument in i18n._() must be a raw string.';
  }
  if (len === 4 && !isString(args[3])) {
    return 'The <context> argument in i18n._() must be a raw string.';
  }
  return null;
}

module.exports = function (context) {
    return {
        "CallExpression": function (node) {
            if (isI18n(node.callee)) {
              const error = validateArgs(node.arguments);
              if (error) {
                context.report(node, error);
              }
            }
        }
    };
};
