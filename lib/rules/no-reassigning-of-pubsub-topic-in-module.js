//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

// This Rule prevents risky usages of the pubsubSubscribe functionality of web Modules.
//
// It's main purpose is to prevent reassigning a callback function for a topic
// for a channel. As if that happens the previous callback function will be replaced,
// which differs from the P.pubsub.subscribe functionality behavior.
//
// It's a bit extra cautious, to simplify the linter and standardize the code however
// all current code adhered to the expected patterns, so it helps to keep consistency.
//
// When in doubt the following is a standard usage example of pubsubSubscribe:
//
// var topicToHandlerMap = {};
// topicToHandlerMap[P.CONST.PUBSUB_TOPIC_CAMPAIGN_CREATED] = this.onCampaignCreatedOrUpdated;
// topicToHandlerMap[P.CONST.PUBSUB_TOPIC_CAMPAIGN_UPDATED] = this.onCampaignCreatedOrUpdated;
// this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_CURRENT_ADVERTISER, topicToHandlerMap);
//
// You can also check out the valid and invalid test cases for this rule.

var _ = require('lodash');

module.exports = function (context) {
    // VariableDeclarators in each scope
    // E.g. [[VariableDeclarator, VariableDeclarator]]
    var variableDeclaratorStacks = [[]];

    // Variable to topics relationships
    // E.g. [[{'topicToHandlerMap': 'PUBSUB_TOPIC_CAMPAIGN_UPDATED'},
    //   {'topicToHandlerMap': '___^_^_____INVALID_TOPIC_____'}]]
    var variableToTopicStacks = [[]];

    // Channel to topics relationship
    // Targets don't need to be scoped as this linter tests for
    // and doesn't support nested module extends.
    // E.g. { 'PUBSUB_CHANNEL_CURRENT_ADVERTISER' :
    //   {'PUBSUB_TOPIC_CAMPAIGN_UPDATED' : true, 'PUBSUB_TOPIC_CAMPAIGN_CREATED' : true }}
    var channelsToTopics = {};

    // Verify that we don't have a nested extends
    var nodeThatExtendsOutermostModule = null;

    // Tag used when an invalid topic format is found.
    var INVALID_TOPIC_TAG = '__(^_^)___INVALID_TOPIC_____';

    var weAreWithinAModule = function() {
        return !!nodeThatExtendsOutermostModule;
    };

    var report = function(node, message, failingConditionNumber) {
        context.report(node, message, failingConditionNumber, false);
    };

    var processCallExpressionWhenInsideOfAModule = function(node) {
        var message = '';

        // Accept things like:  '*.pubsubSubscribe('
        if (node.callee.type !== 'MemberExpression' ||
                node.callee.property.name !== 'pubsubSubscribe') {
            // Not something we are interested in.
            return;
        }

        // Accept things like:  'this.pubsubSubscribe(' or 'self.pubsubSubscribe('
        // Currently we are allowing using self here, however
        // another linter will enforce binding this instead of
        // assigning say var self = this; or var that = this;
        if (node.callee.object.type !== 'ThisExpression' &&
                (node.callee.object.type !== 'Identifier' || node.callee.object.name !== 'self')) {
            message = 'Calling pubsubSubscribe within a module is only allowed on \"this\". ' +
                'To listen into other module please use .listen() as per ' +
                'https://w.pinadmin.com/display/enKB/Communicating+between+modules';
            report(node, message, 1);
            return;
        }

        // Accept things like: this.pubsubSubscribe(whatever, Identifier)
        // To standardize and make linting easier and since
        // currently all instances follow the pattern.
        if (node.arguments.length < 2 || node.arguments[1].type !== 'Identifier') {
            message = 'Calling pubsubSubscribe is only allowed with a variable name as its second parameter. ' +
                'E.g. this.pubsubSubscribe(P.CONST.PUBSUB_CHANNEL_PROMOTED_PIN_CREATE_FLOW, topicToHandlerMap).';
            report(node, message, 2);
        }


        var variableName = node.arguments[1].name;

        var allVariableDeclarators = _.flatten(variableDeclaratorStacks);
        var variableDeclarator = _.find(allVariableDeclarators, function(possibleVariableDeclarator) {
            return (possibleVariableDeclarator.id.name === variableName);
        });

        // Check if we found the declaration of the variable used as the 2nd parameter.
        // All current code at the time of writing this rule used a declared variable.
        if (!variableDeclarator) {
            message = 'You used a variable as the second argument to a this.pubsubSubscribe call which ' +
                'was not previously defined in a "var something =" assigment. If the variable came as a ' +
                'parameter please assign it then to another declared variable.';
            report(node, message, 3);
            return;
        }

        // Check if the variable was initalized as:
        // E.g. var something = {};
        if (variableDeclarator.init.type !== 'ObjectExpression' ||
                variableDeclarator.init.properties.length !== 0) {
            message = 'You used a variable as the second argument to a this.pubsubSubscribe call which ' +
                'was not initalized like: "var something = {};". Please initalize it to an empty object';
            report(variableDeclarator, message, 4);
            return;
        }

        // Check if the pubsub target follows either of the following patterns:
        // P.CONST.PUBSUB_CHANNEL_CURRENT_ADVERTISER
        // *
        // where * matches /(^id$|'id'|_id|[a-z]Id)/g to allow our current code instances:
        // this.options['user_id'], this.getResourceId(), this.data['id'], boardId,
        // this.options['board_id'], interestId, pinId, this.pinId, mod.getBoardId(),
        // userId, this.options['user_id'], this.extraData['userId']
        var targetIsUsingPConst = node.arguments[0].type === 'MemberExpression' &&
            node.arguments[0].property.type === 'Identifier' &&
            node.arguments[0].object.type === 'MemberExpression' &&
            node.arguments[0].object.property.type === 'Identifier' &&
            node.arguments[0].object.property.name === 'CONST' &&
            node.arguments[0].object.object.type === 'Identifier' &&
            node.arguments[0].object.object.name === 'P';
        var allowedTargetWithIdRegex = /(^id$|'id'|_id|[a-z]Id)/g;
        var targetSourceCode = context.getSource(node.arguments[0]);
        var targetIsUsingAnAllowedExpression = targetSourceCode.match(allowedTargetWithIdRegex) !== null;
        if (!targetIsUsingPConst && !targetIsUsingAnAllowedExpression) {
            message = 'You are using a target for a this.pubsubSubscribe call that was not recognized ' +
                'as either a P.CONST.* constant or something that is likely to be obtaining an id ' +
                'such as something like: ' + allowedTargetWithIdRegex;
            report(node, message, 5);
            return;
        }

        var channelName;
        if (targetIsUsingPConst) {
            channelName = node.arguments[0].property.name;
        } else {
            // Using the source code of the argument as a string here, therefore in this case
            // we would be extra cautious, so as to simplify the linter, as we won't be taking into account
            // the current variables scope and therefore something like "mod.getBoardId()" may actually
            // give different results in different functions within a module. However balancing
            // everything it's a good tradeoff, in such a case of a false positive all that's needed
            // is to change the expresion to be more semantic to differentiate the use case. No such
            // false positives yet presented.
            channelName = context.getSource(node.arguments[0]);
        }

        if (!channelsToTopics[channelName]) {
            channelsToTopics[channelName] = {};
        }

        var variableToTopicObjects = _.flatten(variableToTopicStacks);

        for (var i = 0; i < variableToTopicObjects.length; i ++) {
            var topic = variableToTopicObjects[i][variableName];
            if (topic) {

                // Check if an invalid topic tag was used.
                // Something like:
                // topicToHandlerMap['pubsub_topic_campaign_updated'] = this.onCampaignCreatedOrUpdated;
                if (topic === INVALID_TOPIC_TAG) {
                    message = 'You didn\'t use a P.CONST.* constant when defining one of the' +
                        'topics subscribed for this channel when using this.pubsubSubscribe';
                    report(node, message, 6);
                    return;
                }

                // Check if topic was already used for the channel
                if (channelsToTopics[channelName][topic]) {
                    message = 'You are subscribing to the same topic on the same channel' +
                        ' on the same module more than once, each module-channel ' +
                        'combination only allows one callback per topic, as they are overwritten as they' +
                        'are assigned.';
                    report(node, message, 7);
                    return;
                }

                // Mark as used so that it can't be used again
                channelsToTopics[channelName][topic] = true;
            }
        }
    };

    return {
        "Program:exit": function(node) {
        },

        "VariableDeclarator": function (node) {
            variableDeclaratorStacks[variableDeclaratorStacks.length - 1].push(node);
        },

        "FunctionExpression": function (node) {
            variableDeclaratorStacks.push([]);
            variableToTopicStacks.push([]);
        },

        "FunctionExpression:exit": function (node) {
            variableDeclaratorStacks.pop();
            variableToTopicStacks.pop();
        },

        "AssignmentExpression": function (node) {
            if (node.left.type !== 'MemberExpression' || node.left.object.type !== 'Identifier') {
                // Not a candidate.
                return;
            }

            var variableName = node.left.object.name;
            var topicName;

            // Check if we are using something like:
            // *[*] = *
            if (node.left.computed) {
                // Check if we are using something like:
                // *[P.CONST.PUBSUB_TOPIC_CAMPAIGN_UPDATED] = *;
                if (node.left.property.type !== 'MemberExpression' ||
                        node.left.property.property.type !== 'Identifier' ||
                        node.left.property.object.type !== 'MemberExpression' ||
                        node.left.property.object.property.type !== 'Identifier' ||
                        node.left.property.object.property.name !== 'CONST' ||
                        node.left.property.object.object.type !== 'Identifier' ||
                        node.left.property.object.object.name !== 'P') {
                    // It's not a candidate.
                    //return;
                    topicName = INVALID_TOPIC_TAG;
                } else {

                    topicName = node.left.property.property.name;
                }
            } else {
                // Using incorrectly something like:
                // topicToHandlerMap.* = this.onCampaignCreatedOrUpdated;

                topicName = INVALID_TOPIC_TAG;
            }

            // Check if we find the variable name in our current stack
            // starting within the innermost scope.
            for (var i = variableDeclaratorStacks.length - 1; i >= 0; i--) {
                for (var e = 0; e < variableDeclaratorStacks[i].length; e++) {
                    if (variableDeclaratorStacks[i][e].id.name === variableName) {

                        // If we find it, then add a variable to topic association.

                        var variableToTopicNameObject = {};
                        variableToTopicNameObject[variableName] = topicName;
                        variableToTopicStacks[i].push(variableToTopicNameObject);

                        // We only need to assign the relationship once and at the
                        // innermost scope level in which it was present.
                        return;
                    }
                }
            }
        },

        "CallExpression": function(node) {
            if (weAreWithinAModule()) {
                processCallExpressionWhenInsideOfAModule(node);
            }

            if (node.callee.type === 'MemberExpression' &&
                    node.callee.property.name === 'extend' &&
                    node.callee.object.type === 'MemberExpression' &&
                    node.callee.object.property.name === 'Module' &&
                    node.callee.object.object.type === 'Identifier' &&
                    node.callee.object.object.name === 'P') {
                if (weAreWithinAModule()) {
                    var message = 'Extending modules inside the extension of other ' +
                        'modules is not allowed, if you think it should be supported maybe ' +
                        'this was an incorrect assumption and this linter should ' +
                        'be modified to support it. Other results from this linter thus could be invalid.';
                    report(node, message, 0);
                } else {
                    nodeThatExtendsOutermostModule = node;
                }
            }
        },

        "CallExpression:exit": function(node) {
            if (node === nodeThatExtendsOutermostModule) {
                nodeThatExtendsOutermostModule = null;
            }
        }
    };
};
