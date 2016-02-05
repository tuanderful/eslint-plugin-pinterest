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
        this.pubsubSubscribe(this.unLikELyWayToGetAniD, topicToHandlerMap);
    },

    doSomething: function() {
    }
});
