/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {
        P.pubsub.subscribe(
            P.CONST.PUBSUB_CHANNEL_SITE,
            P.CONST.PUBSUB_TOPIC_NAG_STATE,
            this.aFunction
        );
    },

    aFunction: function(channel, topic, something) {
    },

    doSomething: function() {
    }
});
