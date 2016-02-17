var oid = require('oid');
/**
 * The overall algorithm is whenver we detect $ as an identifier, we iterativelly go up the AST tree (to prevent chained calls)
 * and to check each of the jQuery funciton call is either whitelisted or safe to call.
 * Unfortunately, this linter is not capable detecting the case that jQuery object being returned from a function call.
 * For example,
 *      function: getContent() {return this.$('blah blah');}
 *      ...
 *      this.getContent().addClass(...);
 */

//------------------------------------------------------------------------------
// Rule Definition
// Lint against jquery function calls outside of render() or updateDom() in modules
//
// There are 5 patterns that we want to lint against.
//
// 1.   $foo.func() - calling a jquery function on a jquery object
//      This line has the AST:
//      {
//          type: 'CallExpression'
//          callee: {
//              type: 'MemberExpression',
//              object: {
//                  type: 'Identifier',
//                  name: "$foo"
//              }
//          }
//      }
// 2.  $('...').func() - calling a jquery function on a jquery object returned by the jquery selector
//     This line has the AST:
//     {
//         "type": "CallExpression",
//         "callee": {
//             "type": "MemberExpression",
//             "object": {
//                 "type": "CallExpression",
//                 "callee": {
//                     "type": "Identifier",
//                     "name": "$"
//                 },
//                 "arguments": [
//                     {
//                         "type": "Literal",
//                         "value": "...",
//                     }
//                 ]
//             },
//             "property": {
//                 "type": "Identifier",
//                 "name": "func"
//             }
//         }
//      }
// 3.   $('...').func().func2() - chaining jquery function calls. This AST is similar to the ones above
//      but more layers of nested callExpression -> MemberExpression calls.
//      For example:
// {
//     "type": "CallExpression",
//         "callee": {
//             "type": "MemberExpression",
//             "object": {
//                 "type": "CallExpression",
//                 "callee": {
//                     "type": "MemberExpression",
//                     "object": {
//                         "type": "CallExpression",
//                         "callee": {
//                             "type": "Identifier",
//                             "name": "$"
//                         },
//                         "arguments": [
//                             {
//                                 "type": "Literal",
//                                 "value": "...",
//                             }
//                         ]
//                     },
//                     "property": {
//                         "type": "Identifier",
//                         "name": "func"
//                     }
//                 },
//                 "arguments": []
//             },
//             "property": {
//                 "type": "Identifier",
//                 "name": "func2"
//             }
//         }
//     }
// }
//
// The pattern that we are looking for is an Identifier that contains '$' and is calling a member property
// that is a blacklisted jquery function. And the linter keeps going up the layer to look for chain calls.
//
// 4. this.$el.func() - lint against a jquery function/variable if it's a member of an object.
//      "type": "ExpressionStatement",
//            "expression": {
//                 "type": "CallExpression",
//                 "callee": {
//                     "type": "MemberExpression",
//                     "computed": false,
//                     "object": {
//                         "type": "MemberExpression",
//                         "computed": false,
//                         "object": {
//                             "type": "ThisExpression"
//                         },
//                         "property": {
//                             "type": "Identifier",
//                             "name": "$el"
//                         }
//                     },
//                     "property": {
//                         "type": "Identifier",
//                         "name": "func"
//                     }
//                 },
//                 "arguments": []
//             }

// 5. this.$('selector...').func() - lint against using dom manipulation calls after a jquery selector.
//      "type": "ExpressionStatement",
//         "expression": {
//             "type": "CallExpression",
//             "callee": {
//                 "type": "MemberExpression",
//                 "object": {
//                     "type": "CallExpression",
//                     "callee": {
//                         "type": "MemberExpression",
//                         "object": {
//                             "type": "ThisExpression"
//                         },
//                         "property": {
//                             "type": "Identifier",
//                             "name": "$"
//                         }
//                     },
//                     "arguments": [
//                         {
//                             "type": "Literal",
//                             "value": "selector...",
//                             "raw": "'selector...'"
//                         }
//                     ]
//                 },
//                 "property": {
//                     "type": "Identifier",
//                     "name": "func"
//                 }
//             },
//         }
//------------------------------------------------------------------------------

module.exports = function (context) {
    var functionStack = [];
    var renderFunctions = {};

    var SAFE_JQUERY_METHODS = [
        'ajax',
        'ajaxSend',
        'click',
        'data',
        'each',
        'filter',
        'get',
        'has',
        'height',
        'index',
        'is',
        'length',
        'param',
        'position',
        'replace',
        'serializeArray',
        'siblings',
        'slice',
        'toArray',
        'top',
        'trim',
        'width',
        'find',
        'closest',
        'parent',
        'parents',
        'children',
        'on',
        'mousedown',
        'keypress',
    ];

    var SAFE_JQUERY_METHODS_WHEN_CALLED_WITHOUT_PARAMS = [
        'css',
        'html',
        'text',
        'focus',
        // This is a function that we added to $ in Placeholder.js. Not sure if we still need this
        // TODO(jchuang) See if we still need to polyfill placeholder.
        'placeholder',
        'val',
    ];

    var SAFE_JQUERY_METHODS_WHEN_CALLED_WITH_1_PARAM = [
        'attr',
        'eq',
    ];

    var whitelistedMethods = [
        '_highlightElement',
        '_logContextEventFromElem',
        '_makeAnimatedElement',
        '$clamp',
        'add',
        'addBack',
        // 'addClass',
        'after',
        'always',
        'animate',
        'append',
        'appendTo',
        'appendToElement',
        'apply',
        'attr',
        'before',
        'bind',
        'blur',
        'change',
        // not a jquery function but it's chained with trim.
        // (jchuang) TODO fix this with trim
        'charCodeAt',
        'clone',
        'closest',
        'contains',
        'contents',
        'create',
        'css',
        'delay',
        'delegate',
        'detach',
        'done',
        'droppable',
        'draggable',
        'empty',
        'extend',
        'fadeIn',
        'fadeOut',
        'fadeTo',
        'first',
        'fixtureProperty',
        'fixedsticky',
        'flashScrollbar',
        'focus',
        'focusout',
        'focusWithoutScrolling',
        'getScrollableElementForElement',
        'getScript',
        'hasClass',
        'hide',
        'hover',
        'inArray',
        'initHovering',
        'innerWidth',
        'insertAfter',
        'insertBefore',
        'insertChild',
        'insertChildBefore',
        'isElement',
        'isHovering',
        'Jcrop',
        'last',
        'listen',
        'load',
        'logContextEvent',
        'map',
        'merge',
        'navigate',
        'next',
        'nextAll',
        'off',
        'offset',
        'one',
        'overflowingText',
        'outerHeight',
        'outerMethod',
        'outerWidth',
        'parentsUntil',
        'plot',
        'positionAncestor',
        'positionElementAtAnchor',
        'prepend',
        'prependTo',
        'prev',
        'prop',
        'proxy',
        'queue',
        'ready',
        'remove',
        'removeAttr',
        // 'removeClass',
        'removeData',
        'removeProp',
        'replaceWith',
        'resize',
        'scrollLeft',
        'scrollTop',
        'select',
        'setModalPosition',
        'setSelectionRange',
        'show',
        'simplebar', //scrollbar library for flashlight
        'slideUp',
        'sortable',
        'spin',
        'startPreventScroll',
        'submit',
        'teststrength',
        // 'text',
        'toggle',
        'toggleClass',
        'toLowerCase',
        'transition',
        'trigger',
        'triggerEvent',
        // 'trim',
        'unbind',
        'validateInput',
        'wrap'
    ];

    function _checkCurrentlyInRender() {
        for (var i = 0; i < functionStack.length; i++) {
            if (renderFunctions[functionStack[i]] === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * What functions are safe to call? Function that
     * - equals to $
     * - is whitelisted unless there is a setting that ignores the whitelist
     * - is safe to call with no parameter
     * - is safe to call with one parameter
     */
    function _isFunctionSafeToCall(node, memberExpression) {
        return memberExpression === '$' ||
            ((whitelistedMethods.indexOf(memberExpression) !== -1 && !(context.settings && context.settings.no_whitelist)) ||
            (node.parent.type === 'CallExpression' &&
                (SAFE_JQUERY_METHODS.indexOf(memberExpression) !== -1 ||
                (SAFE_JQUERY_METHODS_WHEN_CALLED_WITHOUT_PARAMS.indexOf(memberExpression) !== -1 &&
                    node.parent.arguments.length === 0) ||
                (SAFE_JQUERY_METHODS_WHEN_CALLED_WITH_1_PARAM.indexOf(memberExpression) !== -1 &&
                    node.parent.arguments.length === 1))));
    }

    return {
        "FunctionExpression": function (node) {
            var hash = oid.hash(node);
            functionStack.push(hash);

            if (node.parent && node.parent.type === 'Property' &&
                (node.parent.key.name === 'render' || node.parent.key.name === 'updateDom')) {
                renderFunctions[hash] = true;
            }
        },

        "FunctionExpression:exit": function (node) {
            functionStack.pop();
        },

        "Identifier": function (node) {
            if (node.name.indexOf('$') === 0 && !_checkCurrentlyInRender()) {
                var parent = node.parent;
                var grandParent = parent && parent.parent ? parent.parent : null;

                while (parent && grandParent) {
                    // TODO(tuan): eventually remove the === VariableDeclarator filter
                    if (grandParent.type === 'VariableDeclarator') {
                        return;
                    }

                    // Move the parent and grandParent pointer up a level for the $('...').func() jquery selector case because
                    // the CallExpression object ($('...') part) would be the parent of the $ Identifier.
                    if (parent.type === 'CallExpression' || parent.type === 'MemberExpression' && grandParent.type === 'MemberExpression') {
                        parent = parent.parent;
                        grandParent = parent && parent.parent ? parent.parent : null;
                    // Lints the $foo.func() and $foo.func().func() (chained calls) cases
                    // and ignore the case of $foo being an argument of a function call. For example. this.listen(..., this.$el, ...);
                    } else if (parent.type === 'MemberExpression' && grandParent.type === 'CallExpression' &&
                        grandParent.arguments.indexOf(parent) === -1) {
                        var source = context.getSource(grandParent);
                        var codeSample = source.replace(/(\n|\s)+/g, ' ');

                        if (!_isFunctionSafeToCall(parent, parent.property.name)) {
                            context.report(node, 'Checkout out http://pinch.pinadmin.com/DeclarativeStates and search for ' + parent.property.name + "\n" +
                                'Error: jQuery method ' + parent.property.name + ' may only be called from inside of .render() or .updateDom(): ' +
                                codeSample);
                        }

                        // Keeps traversing up the tree for the chained calls.
                        parent = grandParent.parent;
                        grandParent = parent && parent.parent ? parent.parent : null;
                    } else {
                        break;
                    }
                }
            }
        }
    };
};
