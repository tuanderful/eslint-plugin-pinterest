var _ = require('lodash');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var allowedParentIdentifiers = [
    /^callCreate$/,
    /^callDelete$/,
    /^callGet$/,
    /^callUpdate$/
];

module.exports = function (context) {
    var safeExpressions = [];

    var getExpression = function(node) {
        while (node.parent && ['BlockStatement', 'VariableDeclaration',
                'Program', 'FunctionExpression'
            ].indexOf(node.parent.type) === -1) {
            node = node.parent;
        }
        return node;
    };

    return {
        "CallExpression:exit": function (node) {
            if (node.callee.type !== 'MemberExpression' ||
                node.callee.property.type !== 'Identifier' ||
                node.callee.property.name !== 'then') {
                return;
            }

            var parent = node.parent;
            while (parent &&
                ['BlockStatement', 'Property', 'AssignmentExpression',
                    'VariableDeclarator', 'ReturnStatement'].indexOf(parent.type) === -1) {
                if (parent.type === 'CallExpression' &&
                        parent.callee.type === 'MemberExpression' &&
                        parent.callee.property.type === 'Identifier' &&
                        ['catch', 'then'].indexOf(parent.callee.property.name) !== -1) {
                    // skip if this is not the last promise in the chain
                    return;
                }
                parent = parent.parent;
            }

            if (parent && parent.type === 'BlockStatement') {
                if (!node.arguments || node.arguments.length < 2) {
                    if (safeExpressions.indexOf(getExpression(node)) !== -1) {
                        // check if the expression has been marked as safe due to
                        // a "safe" sibling identifier
                        return;
                    }
                    context.report(node, 'The last .then() in a promise chain must pass an ' +
                'error handler as the second argument: ' + context.getSource(node.callee).replace(/\n\s*/g, '\\n'));
                }
            }
        },

        "Identifier": function(node) {
            // filter out identifiers which may be in a statement causing it to
            // be safe for `this` without binding
            if (_.find(allowedParentIdentifiers, function(filter) {
                    return node.name.match(filter);
                })) {
                var expression = getExpression(node);
                safeExpressions.push(expression);
            }
        },
    };

};
