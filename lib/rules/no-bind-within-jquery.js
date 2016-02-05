//------------------------------------------------------------------------------
// Rule Definition
//
// This task ensures that `this` (usually a reference to a Module) isn't bound to a
// function who's `this` refers to an HTML element and shouldn't be overridden.
//
// As an example this task would catch:
//    this.$('a').each(function() {
//        var $tab = $(this);
//        $tab.toggleClass('active', this.isActive);
//    }.bind(this));
//
// In this case the better pattern is to use `self`:
//    var self = this;
//    this.$('a').each(function() {
//        var $tab = $(this);
//        $tab.toggleClass('active', self.isActive);
//    };
//------------------------------------------------------------------------------


module.exports = function(context) {
    var boundFunctions = [];

    var getExpression = function(node) {
        while (node.parent && node.parent.type !== 'FunctionExpression') {
            node = node.parent;
        }
        return node.parent || node;
    };

    var isWrapper = function(node) {
        if (node.parent &&
            node.parent.type === 'CallExpression' &&
            node.parent.callee.type === 'MemberExpression' && ['call',
                'apply'
            ].indexOf(node.parent.callee.property.name) !== -1 &&
            node.parent.arguments &&
            node.parent.arguments.length &&
            node.parent.arguments[0] === node) {
            return true;
        }
        return false;
    };

    return {
        "CallExpression": function(node) {
            if (node.callee.type !== 'MemberExpression' ||
                node.callee.property.type !== 'Identifier' ||
                node.callee.property.name !== 'bind' ||
                node.callee.object.type !== 'FunctionExpression') {
                return false;
            }
            boundFunctions.push(node.callee.object);
        },

        "ThisExpression": function(node) {
            // ignore any .apply() and .call() functions or jquery functions
            if (isWrapper(node)) {
                return;
            }

            if (node.parent && node.parent.type === 'CallExpression' &&
                    node.parent.callee.type === 'Identifier' &&
                    node.parent.callee.name === '$' &&
                    node.parent.arguments[0] === node) {
                var expression = getExpression(node);
                if (boundFunctions.indexOf(expression) !== -1) {
                    context.report(node,
                            '"this" is being bound to a function where "this" refers to an ' +
                            'HTML element and shouldn\'t be overridden: ' +
                            context.getSource(expression));
                }
            }
        }
    };

};
