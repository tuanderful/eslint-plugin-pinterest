//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

// This Rule prevents the use of P.pubsub.subscribe within a module, which is
// risky as you'd need to manually unsubscribe (which is not currently done in
// many infringing code instances) and also manually check if you are not already
// subscribed (which caused a performance bug afecting every navigation).
// Instead use the module's this.pubsubSubscribe() method which takes care of that.

/// var EslintPintester = require('../../build_utils/eslint_pintester').EslintPintester;

module.exports = function (context) {
    // var whitelist = [
    //     {
    //         // Remove after improve_performance_of_click_processing experiment ends
    //         files: 'webapp/app/common/modules/growth/tutorials/UserEducationGuideDropdown/UserEducationGuideDropdown\\.js$',
    //         testCaseNumbers: [0]
    //     }
    // ];
///    var pintester = new EslintPintester(context, whitelist);

    var nodeThatExtendsOutermostModule = null;

    var weAreWithinAModule = function() {
        return !!nodeThatExtendsOutermostModule;
    };

    var report = function(node, message, failingConditionNumber) {
        context.report(node, message, failingConditionNumber, false);
    };

    return {
        "Program:exit": function(node) {
//            pintester.finalize(node);
        },

        "CallExpression": function(node) {
            if (weAreWithinAModule()) {
                // Check if we are incorrectly calling P.pubsub.subscribe
                if (node.callee.type === 'MemberExpression' &&
                        node.callee.property.name === 'subscribe' &&
                        node.callee.object.type === 'MemberExpression' &&
                        node.callee.object.property.name === 'pubsub' &&
                        node.callee.object.object.type === 'Identifier' &&
                        node.callee.object.object.name === 'P') {
                    var message = 'Calling P.pubsub.subscribe directly within a module is not allowed. ' +
                        'Please instead use the module\'s this.pubsubSubscribe() method for this.';
                    report(node, message, 0);
                }
            }

            if (node.callee.type === 'MemberExpression' &&
                    node.callee.property.name === 'extend' &&
                    node.callee.object.type === 'MemberExpression' &&
                    node.callee.object.property.name === 'Module' &&
                    node.callee.object.object.type === 'Identifier' &&
                    node.callee.object.object.name === 'P') {
                if (weAreWithinAModule()) {
                    // We can ignore this in this rule as even if being within
                    // nested extends, which is probably wrong (but another
                    // rule should be written for it) we should not use
                    // P.pubsub.subscribe directly.
                } else {
                    nodeThatExtendsOutermostModule = node;
                }
            }
        },

        "CallExpression:exit": function(node) {
            if (node === nodeThatExtendsOutermostModule) {
                nodeThatExtendsOutermostModule = null;
            }
        }
    };
};
