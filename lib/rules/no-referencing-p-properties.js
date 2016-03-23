//------------------------------------------------------------------------------
// Rule Definition
//
// Developers should not reference properties on P. Instead, they should require
// the appropriate module.
//
// For example, instead of this:
//
//     var P = require('./P.js')
//     var appInstance = P.app.instance
//
// Do this:
//
//     var app = require('./app.js');
//     var appInstance = app.instance;
//
// The only property on P that should be accessed is `expose`.
//------------------------------------------------------------------------------

module.exports = function (context) {

    return {
        "MemberExpression": function (node) {
            if (node.object.type === 'Identifier' && node.object.name === 'P') {

                // only allow P.expose
                if (node.property.type === 'Identifier' && node.property.name === 'expose') {
                    return;
                }

                var property = node.property.name;
                context.report(node, `require ${property} rather than referencing P.${property}`);
            }
        }
    };

};
