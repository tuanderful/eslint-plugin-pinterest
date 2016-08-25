/**
 * @fileoverview Rule to require sorting of import declarations
 * @author Imad Elyafi
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "enforce sorted import declarations within modules",
            category: "ECMAScript 6",
            recommended: false
        },

        fixable: "code",

        schema: [
            {
                type: "object",
                properties: {
                    ignoreCase: {
                        type: "boolean"
                    },
                    memberSyntaxSortOrder: {
                        type: "array",
                        items: {
                            enum: ["none", "all", "single", "multiple"]
                        },
                        uniqueItems: true,
                        minItems: 4,
                        maxItems: 4
                    },
                    ignoreMemberSort: {
                        type: "boolean"
                    },
                    pathsOnTop: {
                        type: "array",
                        uniqueItems: true
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create: function(context) {
        const configuration = context.options[0] || {},
            ignoreCase = configuration.ignoreCase || false,
            ignoreMemberSort = configuration.ignoreMemberSort || false,
            memberSyntaxSortOrder = configuration.memberSyntaxSortOrder || ["none", "all", "single", "multiple"],
            pathsOnTop = configuration.pathsOnTop || ["react", "react-addons-test-utils", "react-dnd", "react-dnd-html5-backend", "react-dom", "react-dom/server", "react-modal", "react-motion", "react-redux", "react-slick", "react-sparklines"],
            sourceCode = context.getSourceCode();

        let declarations = [],
            previousDeclaration = null,
            firstDeclaration = null,
            lastDeclaration = null;

        /**
         * Sorts specifiers
         *
         * @param {Object} specifierA - a node specifier
         * @param {Object} specifierB - a node specifier
         * @returns {number} - sorting result
         */
        function specifierSortingFunction(specifierA, specifierB) {
            if (specifierA.type !== "ImportSpecifier" || specifierB.type !== "ImportSpecifier") {
                return 0;
            }

            let specifierAText = specifierA.local.name;
            let specifierBText = specifierB.local.name;

            if (ignoreCase) {
                specifierAText = specifierAText.toLowerCase();
                specifierBText = specifierBText.toLowerCase();
            }

            if (specifierAText < specifierBText) {
                return -1;
            }
            if (specifierAText > specifierBText) {
                return 1;
            }
            return 0;
        }

        /**
         * Fixes orders of specifiers
         *
         * @param {importSpecifiers} importSpecifiers - array of specifiers
         * @param {firstSpecifier} firstSpecifier - specifier
         * @param {lastSpecifier} lastSpecifier - specifier
         * @param {fixer} fixer - the RuleFixer
         * @returns {*|boolean} fixer result
         */
        function specifierFixingFunction(importSpecifiers, firstSpecifier, lastSpecifier, fixer) {
            const replaceOutput = [];

            for (let i = 0; i < importSpecifiers.length; i++) {
                replaceOutput.push(importSpecifiers[i].local.name);
            }

            return fixer.replaceTextRange(
                [firstSpecifier.range[0], lastSpecifier.range[1]],
                replaceOutput.join(", ")
            );
        }

        /**
         * Gets the used member syntax style.
         *
         * import "my-module.js" --> none
         * import * as myModule from "my-module.js" --> all
         * import {myMember} from "my-module.js" --> single
         * import {foo, bar} from  "my-module.js" --> multiple
         *
         * @param {ASTNode} node - the ImportDeclaration node.
         * @returns {string} used member parameter style, ["all", "multiple", "single"]
         */
        function usedMemberSyntax(node) {
            if (node.specifiers.length === 0) {
                return "none";
            } else if (node.specifiers[0].type === "ImportNamespaceSpecifier") {
                return "all";
            } else if (node.specifiers.length === 1) {
                return "single";
            } else {
                return "multiple";
            }
        }

        /**
         * Gets the group by member parameter index for given declaration.
         * @param {ASTNode} node - the ImportDeclaration node.
         * @returns {number} the declaration group by member index.
         */
        function getMemberParameterGroupIndex(node) {
            return memberSyntaxSortOrder.indexOf(usedMemberSyntax(node));
        }

        /**
         * Sorts import statements
         * TODO(imad): ignore flow type imports
         *
         * @param {nodeA} nodeA ImportDeclaration node.
         * @param {nodeB} nodeB  ImportDeclaration node.
         * @returns {number} returns a number - result of sort
         */
        function sortingFunction(nodeA, nodeB) {
            const nodeASource = nodeA.source.value;
            const nodeBSource = nodeB.source.value;
            const isNodeASourceReact = pathsOnTop.indexOf(nodeASource) !== -1;
            const isNodeBSourceReact = pathsOnTop.indexOf(nodeBSource) !== -1;

            // react imports always goes first
            if (isNodeASourceReact && isNodeBSourceReact) {
                if (nodeASource < nodeBSource) {
                    return -1;
                }

                if (nodeASource > nodeBSource) {
                    return 1;
                }
            } else if (isNodeASourceReact) {
                return -1;
            } else if (isNodeBSourceReact) {
                return 1;
            }

            // usedMemberSyntax is different
            const nodeAGroupOrder = getMemberParameterGroupIndex(nodeA);
            const nodeBGroupOrder = getMemberParameterGroupIndex(nodeB);

            if (nodeAGroupOrder < nodeBGroupOrder) {
                return -1;
            }
            if (nodeAGroupOrder > nodeBGroupOrder) {
                return 1;
            }

            // usedMemberSyntax is the same
            let sourceCodeA = sourceCode.getText(nodeA);
            let sourceCodeB = sourceCode.getText(nodeB);

            if (ignoreCase) {
                sourceCodeA = sourceCodeA.toLowerCase();
                sourceCodeB = sourceCodeB.toLowerCase();
            }

            if (sourceCodeA < sourceCodeB) {
                return -1;
            }
            if (sourceCodeA > sourceCodeB) {
                return 1;
            }
            return 0;
        }

        /**
         * Fixes declaration order
         *
         * @param {fixer} fixer - fixer the RuleFixer
         * @returns {*} - fixer result
         */
        function declarationsFixerFunction(fixer) {
            const replaceOutput = [];

            for (let i = 0; i < declarations.length; i++) {
                replaceOutput.push(sourceCode.getText(declarations[i]));
            }

            return fixer.replaceTextRange(
                [firstDeclaration.range[0], lastDeclaration.range[1]],
                replaceOutput.join("\n")
            );
        }

        return {
            ImportDeclaration: function(node) {
                firstDeclaration = firstDeclaration || node;
                lastDeclaration = node;

                declarations.push(node);
                const sortedDeclarations = declarations.slice().sort(sortingFunction);

                if (declarations.length > 1) {
                    previousDeclaration = declarations[declarations.length - 2];
                }

                const isDeclarationsSorted = declarations.every((importNode, ind) => {
                    if (sortedDeclarations[ind] !== declarations[ind]) {
                        return false;
                    }
                    return true;
                });

                declarations = sortedDeclarations;

                if (!isDeclarationsSorted) {
                    let message;
                    let data = null;

                    const currentMemberSyntaxGroupIndex = getMemberParameterGroupIndex(node),
                        previousMemberSyntaxGroupIndex = getMemberParameterGroupIndex(previousDeclaration);

                    if (currentMemberSyntaxGroupIndex !== previousMemberSyntaxGroupIndex) {
                        message = "Expected '{{syntaxA}}' syntax before '{{syntaxB}}' syntax.";
                        data = {
                            syntaxA: memberSyntaxSortOrder[currentMemberSyntaxGroupIndex],
                            syntaxB: memberSyntaxSortOrder[previousMemberSyntaxGroupIndex]
                        };

                    } else {
                        message = "Imports should be sorted alphabetically. External packages (e.g. React) and node builtins should be on top. Correct order:";
                    }

                    message += "\n" + sortedDeclarations.map((importDecl) => {
                        return sourceCode.getText(importDecl)
                    }).join("\n");

                    context.report({
                        data: data,
                        node: node,
                        message: message,
                        fix: function(fixer) {
                            return declarationsFixerFunction(fixer);
                        }
                    });
                }

                // Multiple members of an import declaration should also be sorted alphabetically.
                if (!ignoreMemberSort && node.specifiers.length > 1) {
                    const importSpecifiers = node.specifiers;
                    const sortedImportSpecifiers = importSpecifiers.slice();
                    const firstSpecifier = importSpecifiers[0];
                    const lastSpecifier = importSpecifiers[importSpecifiers.length - 1];

                    sortedImportSpecifiers.sort(specifierSortingFunction);

                    const isSpecifiersSorted = importSpecifiers.every(function(specifier, ind) {
                        if (sortedImportSpecifiers[ind] !== importSpecifiers[ind]) {
                            return false;
                        }
                        return true;
                    });

                    const importSpecifiersText = "{" + importSpecifiers.map(function(specifier) {
                        return specifier.local.name;
                    }).join(", ") + "}";

                    // TODO(imad): handle situations like, have length check for now
                    // import { testProps, testContext as context } from './test';
                    if (!isSpecifiersSorted && importSpecifiersText.length === sourceCode.getText(node).length) {
                        context.report({
                            node: firstSpecifier,
                            message: "Members '{{memberNames}}' of the import declaration should be sorted alphabetically.",
                            data: {
                                memberNames: importSpecifiersText
                            },
                            fix: specifierFixingFunction.bind(
                                this,
                                sortedImportSpecifiers,
                                firstSpecifier,
                                lastSpecifier
                            )
                        });
                    }
                }
            }
        };
    }
};
