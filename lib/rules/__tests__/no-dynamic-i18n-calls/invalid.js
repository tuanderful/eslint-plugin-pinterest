const i18n = { _: () => {} };
const getText = () => 'Hello world';
i18n._(`Hello world${1}`);
i18n._(getText());
