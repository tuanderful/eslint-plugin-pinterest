//------------------------------------------------------------------------------
// Rule Definition
//
// Disallow assignment of jQuery object to variables not prefixed with $
// if $ call is part of a variable declaration
//------------------------------------------------------------------------------

// jQuery methods that do not return a jQuery object
var SAFE_JQUERY_METHODS = [
    'ajax',
    'attr',
    'data',
    'extend',
    'get',
    'hasClass',
    'height',
    'inArray',
    'is',
    'index',
    'length',
    'offset',
    'outerHeight',
    'outerWidth',
    'param',
    'position',
    'scrollLeft',
    'scrollTop',
    'serializeArray',
    'show',
    'text',
    'top',
    'trim',
    'val',
    'width',

    // used in PositionModule.js, these are variable names that resolve
    // to jQuery methods that are known to return non-jQuery values.
    'fixtureProperty',
    'outerMethod',

    // password_strength_plugin.js
    'teststrength',

    // flot.js (analytics)
    'plot',

    // jquery.csv-0.71.js (sterling)
    'csv'
];


/**
 * Given a CallExpression for the jQuery `get()` method, return true
 * if there is just one Literal argument.
 */
function _isCssGetter(node) {

    // TODO(tuan): properties is a special edge case in GridItems...
    return node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'css' &&
        node.arguments.length === 1 &&
        (node.arguments[0].type === 'Literal' || node.arguments[0].name === 'properties');
}


/**
 * Checks if an ObjectExpression key indicates a jQuery object.
 * @param {Object} node Has node.type of `Literal`.
 */
function _objectKeyContainsJQuery(node) {
    // Literals have value, Identifiers have name
    var key = node.name || node.value;

    // TODO(tuan): remove this whitelist
    if (['anchor', 'el', 'appendTo'].indexOf(key) > -1) {
        return true;
    }

    return (node.type === 'Literal' && typeof key === 'string' && key.indexOf('$') === 0 ) ||
        (node.type === 'Identifier' && key.indexOf('$') === 0 );
}


module.exports = function (context) {

    /**
     * Recursively look at an expression and return true if at least one of the
     * identifiers is prefixed with a $.
     * Empty cases intentionally left in for educational purposes.
     */
    function _containsJQuery(node) {
        if (!node) {
            return false;
        }
        var i;
        switch (node.type) {
            case 'ArrayExpression':
                // Return true if at least one element is a jQuery object.
                var length = node.elements.length;
                for (i = 0; i < length; i++) {
                    if (_containsJQuery(node.elements[i])) {
                        return true;
                    }
                }
                return false;

            case 'AssignmentExpression':
                // ignore left
                return _containsJQuery(node.right);

            case 'BinaryExpression':
                // The result of a binary expression (boolean, arithmetic, etc)
                //   can never a jQuery object.
                return false;

            case 'CallExpression':
                // ignore $...css('some-attr')
                return !_isCssGetter(node, context) && _containsJQuery(node.callee);

            case 'ConditionalExpression':
                // var foo = test ? consequent : alternate
                return _containsJQuery(node.consequent) || _containsJQuery(node.alternate);

            case 'FunctionExpression':
                //TODO(tuan): we should see if the function returns a jQuery object...
                break;

            case 'Identifier':
                return node.name.indexOf('$') === 0;

            case 'Literal':
                // A literal is not a jQuery object. If checking an ObjectExpression
                //   key, use `_objectKeyContainsJQuery()` instead.
                return false;

            case 'LogicalExpression':
                // The result of logical expression is always a boolean primitive.
                return false;

            case 'MemberExpression':
                // If there is a 'safe' method somewhere along the chain,
                //   assume it eventually resolves to a non-jQuery object.
                // If the property computed (accessed via brakcets), like $('img')[0], the
                //   return value is usually a DOM node.

                return (SAFE_JQUERY_METHODS.indexOf(node.property.name) < 0) &&
                    node.computed === false &&
                    (_containsJQuery(node.object) || _containsJQuery(node.property));

            case 'NewExpression':
                return _containsJQuery(node.callee);

            case 'ObjectExpression':
                // ObjectExpressions can never be jQuery objects.
                return false;

            case 'ThisExpression':
                // TODO(tuan): a little more challenging to reason about...
                return false;

            case 'UnaryExpression':
                // unary expressions (+, -, typeof, delete, !) don't return jQuery objects
                return false;

            default:
                // for debugging purposes
                // var source = context.getSource(node);
                // console.log('\n' + context.getFilename());
                // console.log(source.replace(/(\n|\s)+/g, ' '));
                // console.log(node);

        }
    }


    return {
        'AssignmentExpression': function(node) {
            // TODO(tuan): fix breakages & enable this check
            // if (_containsJQuery(node.right) && !_containsJQuery(node.left)) {
            //     var source = context.getSource(node);
            //     context.report(node, 'Variable names for jQuery objects must start with $: ' + source.replace(/(\n|\s)+/g, ' '));
            // }
        },
        'VariableDeclarator': function(node) {
            // `id` is the LHS, `init` is the RHS
            if (node.init !== null) {
                if (_containsJQuery(node.init) && !_containsJQuery(node.id)) {
                    var source = context.getSource(node);
                    context.report(node, 'Variable names for jQuery objects must start with $: ' + source.replace(/(\n|\s)+/g, ' '));
                }
            }
        },
        'ObjectExpression': function(node) {
            // When constructing an object with object literal notation, there is
            //   an array of key/value pairs called `properties`. We need to
            //   iterate over `properties` and ensure each jQuery `value` is
            //   referenced with a $-prefixed `key`.
            var length = node.properties.length;

            for (var i = 0; i < length; i++) {
                if (_containsJQuery(node.properties[i].value) && !_objectKeyContainsJQuery(node.properties[i].key)) {
                    var source = context.getSource(node.properties[i]);
                    context.report(node, 'Keys for jQuery objects must start with $: ' + source.replace(/(\n|\s)+/g, ' '));
                }
            }
        }
    };
};
