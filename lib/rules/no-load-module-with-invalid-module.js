var TaskConfigUtils = require('../../build_utils/utils').TaskConfigUtils;
var EsLintUtils = require('../../build_utils/utils').EsLintUtils;

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    var projDir = EsLintUtils.getProjectDirFromPath(context.getFilename());
    var appName = EsLintUtils.getAppNameFromPath(context.getFilename());

    var getModuleNameFromProps = function(props) {
        if (!props || !props.length) {
            return;
        }

        for (var i = 0; i < props.length; i++) {
            if (props[i].key.name === 'name') {
                return props[i].value.value;
            }
        }
    };

    return {

        "CallExpression": function(node) {

            var moduleName;

            // Targeting `P.loadModule()` calls
            if (node.callee.object && node.callee.object.name &&
                node.callee.object.name === 'P' &&
                node.callee.property.name === 'loadModule') {

                var moduleArg = node.arguments[0];

                switch (moduleArg.type) {

                // We are checking for loadModule() being passed a variable that
                // stores an object literal of the module information, and then getting
                // the module name from then `name` key of that object literal if it
                // exists.
                case 'Identifier':
                    var argName = moduleArg.name;
                    var callExpArgs = context.getScope(node).variables;

                    // Grab scoped variable that matches the argument name
                    for (var i = 0; i < callExpArgs.length; i++) {
                        if (callExpArgs[i].name === argName) {

                            // Grab the module name from the properties
                            var argInit = callExpArgs[i].defs[0].node.init;
                            var argProps = argInit && argInit.properties;
                            moduleName = getModuleNameFromProps(argProps);
                        }
                    }
                    break;

                // Here we're checking for loadModule() being passed an actual object
                // literal and getting the module name from the `name` key
                case 'ObjectExpression':
                    moduleName = getModuleNameFromProps(node.arguments[0].properties);
                    break;

                // TODO(jchan): Check for loadModule() being passed a MemberExpression like
                // `this.options['module']`
                case 'MemberExpression':
                    break;
                default:
                    break;
                }

            }

            if (moduleName) {
                try {
                    TaskConfigUtils.getModuleFilename({}, appName, moduleName, projDir);
                } catch (e) {
                    context.report(node, 'Cannot call module "' + moduleName + '" from "' + appName +
                        '" using `loadModule()` found here: ' + context.getFilename());
                }
            }

        }

    };

};
