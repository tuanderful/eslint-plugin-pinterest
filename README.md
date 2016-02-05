# eslint-plugin-pinterest



## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-pinterest`:

```
$ npm install eslint-plugin-pinterest --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-pinterest` globally.

## Usage

Add `pinterest` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "pinterest"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "pinterest/rule-name": 2
    }
}
```

## Supported Rules

* Fill in provided rules here
