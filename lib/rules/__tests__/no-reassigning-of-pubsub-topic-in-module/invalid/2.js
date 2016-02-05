/**
 * @constructor
 * @extends {P.Module}
 * @param {ModuleConstructorOptions=} options
 */

P.modules.ESLintTestModule = P.Module.extend({

    onContentReady: function() {
        var map = {
            pubsub_topic_nag_state : this.doSomething
        };
        this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_SITE, map);
    },

    doSomething: function() {
    }
});
