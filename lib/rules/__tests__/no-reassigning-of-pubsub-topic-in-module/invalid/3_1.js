/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    aFunction: function(myMap) {
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, myMap);
    },

    onContentReady: function() {
        var topicToHandlerMap = {};
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        this.aFunction(topicToHandlerMap);
    },

    doSomething: function() {
    }
});
