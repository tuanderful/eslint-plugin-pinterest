/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {
        var thatOtherModule = {};
        var topicToHandlerMap = {};
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        thatOtherModule.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, topicToHandlerMap);
    },

    doSomething: function() {
    }
});
