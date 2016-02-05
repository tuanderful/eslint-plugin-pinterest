/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {
        var myOtherVariable = {};
        var topicToHandlerMap = myOtherVariable;
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, topicToHandlerMap);
    },

    doSomething: function() {
    }
});
