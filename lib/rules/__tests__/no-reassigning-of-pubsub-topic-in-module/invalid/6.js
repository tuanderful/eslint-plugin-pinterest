/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {
        var topicToHandlerMap = {};
        topicToHandlerMap['pubsub_topic_nag_state'] = this.doSomething;
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, topicToHandlerMap);
    },

    doSomething: function() {
    }
});
