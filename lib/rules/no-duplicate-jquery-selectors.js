//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {
    var scopeStack = [{selectors:[], childBlockSelectors:[], isBlock:false, isLoop:false}];

    /**
     * Retrieve the current selector scope
     */
    var getCurrentScope = function() {
        return scopeStack[scopeStack.length - 1];
    };

    return {
        "CallExpression": function (node) {
            if (!node.arguments ||
                node.arguments.length !== 1 ||
                node.arguments[0].type !== 'Literal') {
                // only allow single argument calls with a literal arg
                return;
            }

            var selectorInfo;

            if (node.callee.type === 'Identifier' &&
                    node.callee.name === '$') {
                // $('something')
                selectorInfo = {
                    node: node,
                    scope: null,
                    selector: node.arguments[0].value
                };

            } else if (node.callee.type === 'MemberExpression' &&
                    node.callee.property.name === '$') {

                if (node.callee.object.type === 'ThisExpression') {
                    // this.$('something')
                    selectorInfo = {
                        node: node,
                        scope: 'this',
                        selector: node.arguments[0].value
                    };
                } else if (node.callee.object.type === 'Identifier'){
                    // module.$('something')
                    selectorInfo = {
                        node: node,
                        scope: node.callee.object.name,
                        selector: node.arguments[0].value
                    };
                }

            }

            if (!selectorInfo ||
                    typeof selectorInfo.selector !== 'string' ||
                    selectorInfo.selector.indexOf('<') === 0){
                // filter out non-string selectors or selectors which
                // look like markup
                return;
            }

            var currentStack = getCurrentScope();

            if (currentStack.isLoop) {
                // verify that the selector is not defined in a loop
                context.report(node, 'jquery selectors should be defined outside of loops for performance reasons: ' + context.getSource(node));
                return;
            }

            // check if the selector already exists
            var selectors = [].concat(currentStack.selectors,
                    currentStack.childBlockSelectors);
            for (var i = 0; i < selectors.length; i++) {
                var sel = selectors[i];
                if (sel.scope === selectorInfo.scope &&
                        sel.selector === selectorInfo.selector) {
                    // report
                    context.report(node, 'jquery selector already defined at ' +
                        sel.node.loc.start.line + ':' + sel.node.loc.start.column +
                        ', try: var $el = ' + context.getSource(sel.node));
                    return;
                }
            }

            // add the selector to the current scope and all parent scopes up
            // to the first non-block scope. This allows for parallel blocks
            // to define the same selector in the case of an if/else but won't
            // let the parent scope use the same selector
            currentStack.selectors.push(selectorInfo);
            for (i = scopeStack.length - 2; i >= 0; i--) {
                scopeStack[i].childBlockSelectors.push(selectorInfo);
                if (!scopeStack[i].isBlock) {
                    return;
                }
            }
        },

        "BlockStatement": function (node) {
            // reference but don't mutate the parent scope
            scopeStack.push({
                isBlock: true,
                isLoop: getCurrentScope().isLoop ||
                    (node.parent && node.parent.type) === 'ForStatement',
                node:node,
                selectors:[].concat(getCurrentScope().selectors),
                childBlockSelectors:[]
            });
        },

        "BlockStatement:exit": function (node) {
            scopeStack.pop();
        },

        "FunctionExpression": function (node) {
            var isLoop = false;
            var parent = node.parent;
            while (!isLoop && parent && ['BlockStatement'].indexOf(parent.type) === -1) {
                // traverse parents until a block statement is found

                if (parent.type === 'CallExpression') {
                    // if this is a function call, need to see if its an iteration

                    if (parent.callee.type === 'MemberExpression' &&
                            parent.callee.property.type === 'Identifier' &&
                            ['each', 'forEach', 'filter', 'map', 'find', 'reduce', 'every',
                            'some', 'pluck', 'sort', 'contains'].indexOf(
                                parent.callee.property.name) !== -1) {
                        isLoop = true;
                    }
                }
                parent = parent.parent;
            }

            scopeStack.push({
                isBlock: false,
                isLoop: getCurrentScope().isLoop || isLoop,
                node:node,
                selectors:[],
                childBlockSelectors:[]
            });
        },

        "FunctionExpression:exit": function (node) {
            scopeStack.pop();
        }
    };
};
