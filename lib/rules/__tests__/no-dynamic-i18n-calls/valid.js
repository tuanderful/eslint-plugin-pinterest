const i18n = { _: () => {} };
i18n._('Hello world');
i18n._("Hello world");
i18n._(`Hello world`);
i18n._('Multiline strings' +
       'that wrap across multiple' +
       'lines');
i18n._('Hi', 'context');
i18n._('Hi', 'plural', 1);
i18n._('Hi', 'plural', 1, 'context');
