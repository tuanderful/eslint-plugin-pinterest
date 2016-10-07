const i18n = { _: () => {} };
const context = 'context';
const plural = 'plural';
const getText = () => 'Hello world';

// Interpolated template strings
i18n._(`Hello world${1}`);
// Function calls
i18n._(getText());
// Variables
i18n._(context);
// Context
i18n._('Hi', context);
i18n._('Hi', 'plural', 1, context);
// Plural arg
i18n._('Hi', plural, 1);
i18n._('Hi', plural, 1, 'context');
