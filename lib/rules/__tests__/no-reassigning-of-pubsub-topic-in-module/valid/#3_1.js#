/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    aFunction: function(myMap) {
        // Not ideal but to illustrate case
        var myRealMap = {};
        myRealMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = myMap[P.CONST.PUBSUB_TOPIC_NAG_STATE];
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, myRealMap);
    },

    onContentReady: function() {
        var topicToHandlerMap = {};
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        this.aFunction(topicToHandlerMap);
    },

    doSomething: function() {
    }
});
