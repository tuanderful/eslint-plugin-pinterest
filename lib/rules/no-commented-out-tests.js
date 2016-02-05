/**
 * @fileoverview Validates xsugar is used instead of just commenting out an affogato test
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    var lastComment = "";

    function checkMemberExpression(node) {
        if (node.object.name === 'cream') {
            var programNode = node.parent.parent;
            var comments = context.getComments(programNode);

            [comments.leading, comments.trailing].forEach(function(comments) {
                if (comments[0] && comments[0].value) {
                    var currentComment = comments[0].value;

                    /* Often trailing/leading comments for different nodes will be identical */
                    if (currentComment === lastComment) {
                        return;
                    }

                    var regex = /cream\.sugar\(/;
                    if (currentComment.match(regex)) {
                        var lines = currentComment.split('\n');
                        var lineToReport = "";
                        lines.forEach(function(line) {
                            if (!lineToReport && line.match(regex)) {
                                lineToReport = line;
                            }
                        });
                        context.report(node, "Use cream.xsugar instead of commenting out a test.\n" +
                        "/* " + lineToReport + " */");
                    }

                    lastComment = comments[0].value;
                }
            });
        }
    }

    return {
        "MemberExpression": checkMemberExpression
    };
};
