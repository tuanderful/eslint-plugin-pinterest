//------------------------------------------------------------------------------
// Rule Definition
// If CssClassName property is used, and module extends from something other than
// P.Module, then we need to extend the CssClassName object from the parent:
//
//
// P.modules.AppBase = P.Module.extend({
//   CssClassName: {...}
// }
//
// P.modules.App = P.modules.AppBase.extend({
//   CssClassName: _.extend(P.modules.AppBase.prototype.CssClassName, {
//     ...
//   })
// }
//
//------------------------------------------------------------------------------

function resolveMemberExpression(node) {
    if (node.object.type === 'MemberExpression') {
        return resolveMemberExpression(node.object) + '.' + node.property.name;
    } else {
        return node.object.name + '.' + node.property.name;
    }
}

module.exports = function (context) {
    return {
        "Identifier": function (node) {
            if (node.name === 'CssClassName' && node.parent.type === 'Property') {

                // ... and the initialized value of CssClassName is an object literal
                var initValue = node.parent.value;
                if (initValue.type === 'ObjectExpression') {

                    var moduleExtendsCallee = node.parent.parent.parent.callee;
                    var extendedModuleString = resolveMemberExpression(moduleExtendsCallee);

                    // and the module extends from something other than P.Module
                    if (extendedModuleString !== 'P.Module.extend') {

                        var origSource = context.getSource(node.parent);
                        var cssProto = extendedModuleString.replace('extend', 'prototype.CssClassName');
                        var suggestion = origSource.replace('{', '_.extend(' + cssProto + ', {');
                        suggestion = '    ' + suggestion.replace('}', '})');

                        context.report(node, 'CssClassName needs to extend from parent\'s prototype, and parent must have CssClassName defined.\n ' + suggestion);
                    }
                }
            }
        }
    };

};
