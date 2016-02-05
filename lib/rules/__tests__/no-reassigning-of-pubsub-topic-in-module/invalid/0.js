/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {
        P.modules.ESLintTestModule2 = P.Module.extend(
            /** @lends {P.modules.ESLintTestModule2.prototype} */ {

            onContentReady: function() {
            },

            doSomething: function() {
            }
        });
    },

    doSomething: function() {
    }
});
