/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend(
    /** @lends {P.modules.ESLintTestModule.prototype} */ {

    onContentReady: function() {

        // Note: onContentReady may be called several times, thus it's not ideal
        // performance wise, however the Module's pubsubSubscribe functionality
        // overwrites previously set handlers for the same target/topic
        // combination so it's ok unless onContentReady is being called more than
        // once every few seconds, which that would indicate another bug.
        // Using onContentReady has the advantage of the DOM being ready and thus
        // prevents causing bugs by forgetting to check if content is ready in
        // the callback functions.
        // However the following code may be anywhere inside a module:

        var topicToHandlerMap = {};
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE] = this.doSomething;
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE_2] = this.doSomething2;
        topicToHandlerMap[P.CONST.PUBSUB_TOPIC_NAG_STATE_3] = this.doSomething3;
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, topicToHandlerMap);
    },

    doSomething: function() {
    },

    doSomething2: function() {
    },

    doSomething3: function() {
    }
});
