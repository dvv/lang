Lang - i18n for node.js and browsers
====
[![Build Status](https://secure.travis-ci.org/dvv/lang.png)](http://travis-ci.org/dvv/lang)

Unobtrusive inflection sugar is added to vanilla templating.

## Phrases Syntax

-  `#{varname}` Echoes value of variable
-  `#{varname Singular}` Plural forms will be guessed for languages with simple inflection rules
-  `#{varname Singular|Plural2}` Plural form for >=5 is considered equal to as for >=2
-  `#{varname Singular|Plural2|Plural5}` Plural forms explicitly specified

Example
----

    Hi, #{user.name}!
    You've got #{messages.length message}.
    How are your all #{children.length child|children} doing?
    А у меня в кармане #{nails_count} #{nails_count гвоздь|гвоздя|гвоздей}

## Level Ground Usage

```js
//
// create an instance of Locale
//
var Locale = require('lang');
var L = new Locale();

//
// add some phrases
//
L.add('en-GB', {
  demo: {
    hello: 'Hello, #{user.name}!'
  }
});
L.add('ru-RU', {
  demo: {
    hello: 'Привет, #{user.name}!'
  }
});
L.add('ua-UA', {
  demo: {
    hello: 'Здоровенькі були, #{user.name}!'
  }
});

//
// get locale key
//
L.get('demo.hello'); // -> 'Здоровенькі були, #{user.name}!'

//
// use in template
//
var compile = require('jade').compile;
var params = {user: {name: 'ixti'}};

compile(L.get('demo.hello'))(params); // -> 'Здоровенькі були, ixti!'
compile(L.get('demo').hello)(params); // -> 'Здоровенькі були, ixti!'
```

## Advanced Usage

```js
//
// create an instance of Locale
//
var Locale = require('lang');
var L = new Locale({
  // specify phrases compiler
  compiler: require('jade').compile
});

//
// add some phrases
//
L.add('en-GB', {
  demo: {
    hello: 'Hello, #{user.name}! You have got #{messages} #{messages message}'
  }
});
L.add('ru-RU', {
  demo: {
    hello: 'Привет, #{user.name}! Тебе #{messages} #{messages сообщение|сообщения|сообщений}'
  }
});

//
// various ways to get type locale key.
// all values are functions
//
typeof L.get('demo.hello'); // -> 'function'
typeof L.get('demo').hello; // -> 'function'
typeof L.hash.demo.hello;   // -> 'function'

//
// use
//
var params = {user: {name: 'ixti'}, messages: 10};
L.get('demo.hello')(params); // -> 'Привет, ixti! Тебе 10 сообщений'
L.get('demo').hello(params); // -> 'Привет, ixti! Тебе 10 сообщений'
L.hash.demo.hello(params);   // -> 'Привет, ixti! Тебе 10 сообщений'
L.t('demo.hello', params);   // -> 'Привет, ixti! Тебе 10 сообщений'

//
// create another instance of Locale
//
var Locale = require('lang');
var L = new Locale({
  // specify custom tags
  tags: {
    open: '<%=',
    close: '%>'
  }
});

//
// add some phrases
//
L.add('en-GB', {
  demo: {
    hello: 'Hello, #{user.name}! You have got #{messages} #{messages message|messages}'
  }
});

//
// look what phrases are
//
L.get('demo.hello'); // -> 'Hello, <%=user.name%>! You have got <%=messages%> <%=["message","messages"][(messages===1?0:1)]%>'
```

## License

[MIT](lang/license.txt)
