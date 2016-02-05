//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var CHECK_SECOND_COMMENT_LINE = ['@lends'];

module.exports = function(context) {

    var currentFunction;
    var startsWithUnderscore = new RegExp(/^_\w*/);

    var hasUnderscorePrefix = function(fnName) {
        if (fnName === '_') {
            return false;
        }

        return startsWithUnderscore.test(fnName);
    };

    var hasPrivateAnnotation = function(comments) {
        return comments && comments.indexOf('@private') !== -1;
    };

    var extractUnderscoreMember = function(val) {
        if (!val) {
            return false;
        }

        var matchArr = val.match(startsWithUnderscore);
        return matchArr && matchArr[0];
    };

    var shouldCheckSecondCommentLine = function(comments) {
        if (comments) {
            for (var i = 0; i < CHECK_SECOND_COMMENT_LINE.length; i++) {
                if (comments.indexOf(CHECK_SECOND_COMMENT_LINE[i]) !== -1) {
                    return true;
                }
            }
        }

        return false;
    };

    // Performs the two-part check: If the comments have @private in them, make
    // sure the corresponding function is prefixed with underscore. If the function
    // is prefixed with an underscore, make sure comments have @private
    var checkPrivateAndUnderscore = function(leadingComments, funcName) {
        // console.log(leadingComments);

        if (hasPrivateAnnotation(leadingComments)) {
            return hasUnderscorePrefix(extractUnderscoreMember(funcName));
        }

        if (hasUnderscorePrefix(funcName)) {
            return leadingComments && hasPrivateAnnotation(leadingComments);
        }

        return true;
    };

    return {

        "FunctionExpression": function(node) {

            // We only care about top level funcs; cache our node until we
            // are coming back up the tree
            if (currentFunction !== undefined) {
                return;
            } else {
                currentFunction = node;
            }

            // ignore self executing functions
            if (node.parent && node.parent.type === 'CallExpression' &&
                node.parent.callee === node) {
                return;
            }

            var leadingComments;
            var funcName;

            if (node.parent && node.parent.type === 'AssignmentExpression' &&
                node.parent.left.property) {

                leadingComments = node.parent.parent &&
                    node.parent.parent.leadingComments &&
                    node.parent.parent.leadingComments.length &&
                    node.parent.parent.leadingComments[0].value;

                funcName = node.parent.left.property.name;

            } else if (node.parent && node.parent.type === 'Property') {

                leadingComments = node.parent.leadingComments &&
                    node.parent.leadingComments.length &&
                    node.parent.leadingComments;

                // If the comment includes a string in the CHECK_SECOND_COMMENT_LINE array,
                // this may not be the comment that corresponds to the function (ie., the
                // first function in any module's .js file will have this issue because of the
                // @lends comment before it.)
                //
                // If this is the case, assign `leadingComments` to the second index of the
                // comments array if it exists, and fall back to the first if it doesn't.
                //
                // Otherwise, assign `leadingComments` to the first index.
                if (leadingComments && shouldCheckSecondCommentLine(leadingComments[0].value)) {
                    leadingComments = leadingComments[1] ? leadingComments[1].value : leadingComments[0].value;
                } else if (leadingComments) {
                    leadingComments = leadingComments[0].value;
                }

                funcName = node.parent.key.name;

            }

            if (funcName && !checkPrivateAndUnderscore(leadingComments, funcName)) {
                var source = context.getSource(node.parent).split('\n')[0];
                context.report(node,
                    'Private functions must start with "_" and must be annotated with "@private" in the docblock: \n' +
                    source);
                return;
            }

        },

        "FunctionExpression:exit": function(node) {
            // ignore self executing functions
            if (node.parent && node.parent.type === 'CallExpression' &&
                    node.parent.callee === node) {
                return;
            }

            if (currentFunction === node) {
                currentFunction = undefined;
            }

        }
    };

};
