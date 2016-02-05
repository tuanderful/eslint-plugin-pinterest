/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {
        var topicToHandlerMap = {};
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, topicToHandlerMap);

        this.afterSomethingHappened();
    },

    afterSomethingHappened: function() {
        var map2 = {};
        map2[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, map2);
    },

    doSomething: function() {
        // This would never happen
    },

    doSomething2: function() {
        // This would totally happen
    }
});
