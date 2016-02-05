//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    return {
        "CallExpression": function (node) {
            if (node.callee.type !== 'MemberExpression' ||
                node.callee.property.type !== 'Identifier' ||
                node.callee.property.name !== 'bind' ||
                node.callee.object.type === 'FunctionExpression' ||
                node.callee.object.type === 'Identifier' ||
                node.callee.object.type === 'MemberExpression') {
                // allows function(){}.bind(this);
                // allows something.bind(this);
                // allows this.something.bind(this);
                return false;
            }
            context.report(node, '.bind() may only be called on functions: ' + context.getSource(node));
        }
    };

};
