'use strict';

var Locale = require('../');

//
// compose locale
//

var locales = {

  en: {
    foo: 'foo',
    bar: 'bar',
    user: {
      name: 'name',
      family1: 'You\'ve got #{wives} #{wives wife|wives} and #{children} %{child|childre n\'|kindern}:children',
    },
  },

  fr: {
    foo: 'fou',
    user: {
      family2: 'Tu as #{wives} #{wives femme|femmes} et #{children} %{enfant|enfants}:children',
    },
  },

  ru: {
    foo: 'фуй',
    bar: 'буй',
    user: {
      family3: 'У тебя #{wives} #{wives жена|жены|жён} и #{children} %{ребёнок|ребёнка|детей}:children',
    },
  },

};

var ok  = require('assert').ok;
var equal  = require('assert').equal;

require('vows').describe('smoke')
.addBatch({
  'empty locale:': {
    topic: function () {
      return new Locale();
    },
    'has sane defaults': function (L) {
      ok(L);
      ok(typeof L.p === 'function');
      ok(typeof L.add === 'function');
      ok(typeof L.get === 'function');
      ok(typeof L.t === 'function');
    },
  },
  'locale accepts additions': {
    topic: function () {
      var L = new Locale();
      L.add('en', locales.en);
      L.add('fr', locales.fr);
      L.add('ru', locales.ru);
      return L;
    },
    'overriding works': function(L) {
      ok(L);
      ok(L.foo);
      equal(L.user.name, 'name');
      equal(L.foo, locales.ru.foo);
    },
    'getter works': function(L) {
      ok(L);
      equal(L.get('user.name'), L.user.name);
      equal(L.get('user').name, L.user.name);
    },
    'compiler works': function(L) {
      ok(L);
      equal(typeof L.get('user').family3, 'function');
      equal(L.get('user').family3.body, 'var __p=this.p(\'ru\');with(locals||{}){return [\'У тебя \',wives,\' \',__p(wives,["жена","жены","жён"]),\' и \',children,\' \',__p(children,["ребёнок","ребёнка","детей"]),\'\'].join(\'\')}');
    },
    'output is vanilla string': function(L) {
      var vars = {wives: 1, children: 0};
      equal(L.get('user.family1')(vars), "You've got 1 wife and 0 childre n'");
      equal(L.get('user.family2')(vars), "Tu as 1 femme et 0 enfant");
      equal(L.get('user.family3')(vars), "У тебя 1 жена и 0 детей");
    },
    'compiled functions are bound to the locale': function(L) {
      var vars = {wives: 2, children: 5};
      equal(L.get('user.family1').call(null, vars), "You've got 2 wives and 5 childre n'");
    },
  },
  'parsing quirky strings': {
    topic: function () {
      var L = new Locale();
      return L.add('', {
        e00: '  #{   ',
        e01: '  }\t\n #{',
        e02: '  }}\t\n #{',
        e03: '  }}}\t\n #{',
        e1: '#{}',
        e2: '#{1}',
        e3: '#{  }',
        e4: '#{. (.) . (.).}',
        // FIXME: look closer
        e5: '#{. (.) #{} . (.).}',
      });
    },
    'results in ignoring quirks': function (L) {
      //console.log(L);
      equal(L.e00, '  #{   ');
      equal(L.e01, '  }\t\n #{');
      equal(L.e02, '  }}\t\n #{');
      equal(L.e03, '  }}}\t\n #{');
      equal(L.e1.body, 'var __p=this.p(\'\');with(locals||{}){return [\'\',\'\',\'\'].join(\'\')}');
      equal(L.e2.body, 'var __p=this.p(\'\');with(locals||{}){return [\'\',\'1\',\'\'].join(\'\')}');
      equal(L.e3.body, 'var __p=this.p(\'\');with(locals||{}){return [\'\',\'  \',\'\'].join(\'\')}');
      equal(L.e4.body, 'var __p=this.p(\'\');with(locals||{}){return [\'\',\'. (.) . (.).\',\'\'].join(\'\')}');
      // FIXME: look closer
      equal(L.e5.body, 'var __p=this.p(\'\');with(locals||{}){return [\'\',\'. (.) #{\',\' . (.).}\'].join(\'\')}');
    }
  },
  'locale provides helper for templates': {
    topic: function () {
      var L = new Locale();
      L.add('en', locales.en);
      L.add('fr', locales.fr);
      L.add('ru', locales.ru);
      return L;
    },
    'into strings': function(L) {
      equal(typeof L.get('foo'), 'string');
    },
    'or into template-neutral bound functions': function(L) {
      equal(typeof L.get('user.family1'), 'function');
      equal(L.get('user.family1').length, 1);
    },
    'which return strings': function(L) {
      equal(L.t('user.family3', {wives: 1, children: 11}), "У тебя 1 жена и 11 детей");
    },
  },
  'locale provides sugar': {
    topic: function () {
      var L = new Locale();
      L.add('en', {
        foo: 'simple foo',
        bar: 'complex string: reuses [this.foo] #{this.foo}',
        baz: 'more complex string: reuses [this.foo] #{this.foo} and [this.bar] #{this.bar}',
        hello: 'Hello, #{user.name}! You have got #{messages} #{messages message|messages}'
      });
      return L;
    },
    'for reusable interpolation': function(L) {
      equal(typeof L.get('foo'), 'string');
      equal(typeof L.get('bar'), 'function');
      equal(typeof L.get('baz'), 'function');
      equal(L.t('foo'), 'simple foo');
      equal(L.t('bar'), 'complex string: reuses [this.foo] simple foo');
      equal(L.t('baz'), 'more complex string: reuses [this.foo] simple foo and [this.bar] complex string: reuses [this.foo] simple foo');
      equal(L.get('hello').body, 'var __p=this.p(\'en\');with(locals||{}){return [\'Hello, \',user.name,\'! You have got \',messages,\' \',__p(messages,["message","messages"]),\'\'].join(\'\')}');
    },
  },
}).export(module);
