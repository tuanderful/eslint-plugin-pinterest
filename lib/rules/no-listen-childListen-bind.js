//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    return {
        "CallExpression": function (node) {
            var arg;

            if (node.callee.type !== 'MemberExpression' ||
                node.callee.object.type !== 'ThisExpression' ||
                ['listen', 'childListen'].indexOf(node.callee.property.name) === -1) {
                return;
            }

            if (node.callee.property.name === 'childListen') {
                arg = node.arguments[1];
            } else {
                arg = node.arguments[2];
            }

            if (arg.type !== 'CallExpression' ||
                    !arg.arguments ||
                    arg.arguments.length !== 1 ||
                    arg.arguments[0].type !== 'ThisExpression' ||
                    arg.callee.type !== 'MemberExpression' ||
                    // arg.callee.object.type !== 'FunctionExpression' ||
                    arg.callee.property.name !== 'bind') {
                return;
            }

            context.report(node, 'Module functions pass to .listen() and .childListen() are already bound: ' +
                context.getSource(node).replace(/\n\s*/g, '\\n'));
        }
    };

};
