Lang - i18n for node.js and browsers
====
[![Build Status](https://secure.travis-ci.org/dvv/lang.png)](http://travis-ci.org/dvv/lang)

Unobtrusive inflection sugar is added to vanilla templating.

## Phrases Syntax

-  `#{varname}` Echoes value of variable
-  `#{varname Singular|Plurals...}` Plural forms explicitly specified
-  `%{Singular|Plurals...}:varname` Alternate syntax. Plural forms explicitly specified

Example
----

    Hi, #{user.name}!
    You've got #{messages.length message|messages}.
    А у меня в кармане #{nails_count} %{гвоздь|гвоздя|гвоздей}:nails_count

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
L.get('demo.hello'); // -> [Function]
L.get('demo.hello')({user: {name: 'dvv'}}); // -> 'Здоровенькі були, dvv!'
```

## Advanced Usage

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
    simple: 'Simple text',
    hello: 'Hello, #{user.name}! You have got #{messages} #{messages message}'
  }
});
L.add('ru-RU', {
  demo: {
    hello: 'Привет, #{user.name}! Тебе #{messages} %{сообщение|сообщения|сообщений}:messages'
  }
});

//
// various ways to get locale key.
// values are functions if interpolation was seen
//
typeof L.get('demo.hello'); // -> 'function'
typeof L.get('demo').hello; // -> 'function'
typeof L.demo.hello;        // -> 'function'
//
// or plain strings otherwise
//
typeof L.demo.simple;       // -> 'string'

//
// use
//
var params = {user: {name: 'ixti'}, messages: 10};
L.get('demo.hello')(params);     // -> 'Привет, ixti! Тебе 10 сообщений'
L.get('demo').hello(params);     // -> 'Привет, ixti! Тебе 10 сообщений'
L.demo.hello(params);            // -> 'Привет, ixti! Тебе 10 сообщений'
L.demo.hello.call(null, params); // -> 'Привет, ixti! Тебе 10 сообщений'
L.t('demo.hello', params);       // -> 'Привет, ixti! Тебе 10 сообщений'
L.t('simple', params);           // -> 'Simple text'

//
// create another instance of Locale
//
var Locale = require('lang');
var L = new Locale();

//
// add some phrases
//
L.add('en-GB', {
  demo: {
    hello: 'Hello, #{user.name}! You have got #{messages} #{messages message|messages}'
  }
});

//
// add phrases which use phrases
//
L.add('en-GB', {
  demo: {
    h_once: 'once',
    h_twice: '#{this.demo.h_once} and #{this.demo.h_once} is twice'
  }
});

L.t('demo.h_twice', {});  // -> 'once and once is twice'

//
// look what phrases are
//
L.get('demo.hello').body; // -> 'var __p=this.p("en");with(locals||{}){return ["Hello, ",user.name,"! You have got ",messages," ",__p(messages,["message","messages"]),""].join("")}'
```

## License

[MIT](lang/license.txt)
