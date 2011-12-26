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
      ok(L.hash);
      equal(L.options.tags.open, '#{');
      equal(L.options.tags.close, '}');
      ok(!L.compiler);
    },
  },
  'locale adds no significant overhead': {
    topic: function () {
      var localeIds = [
        'en', 'ja', 'vi', 'ko', 'pt-BR', 'fr', 'lv', 'br', 'ga', 'gd', 'cy',
        'ro', 'lt', 'ru', 'uk', 'sr', 'hr', 'sh', 'cs', 'sk', 'pl', 'mk', 'sl'
      ];
      var plurals = require('../lib/plurals');
      var lengths = {};
      for (var i = 0; i < localeIds.length; i++) {
        var L = new Locale();
        L.add(localeIds[i], locales.en);
        var s = L.get('user.family1');
        lengths[localeIds[i]] = Math.round(s.length / locales.en.user.family1.length * 100) / 100;
      }
      return lengths;
    },
    'escaping': function(lengths) {
      ok(lengths);
      console.log(lengths);
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
      ok(L.hash.foo);
      equal(L.hash.user.name, 'name');
      equal(L.hash.foo, locales.ru.foo);
    },
    'getter works': function(L) {
      ok(L);
      equal(L.get('user.name'), L.hash.user.name);
      equal(L.get('user').name, L.hash.user.name);
    },
    'compiler works': function(L) {
      ok(L);
      equal(L.get('user').family3, 'У тебя #{wives} #{["жена","жены","жён"][(wives%10===1&&wives%100!==11?0:wives%10>=2&&wives%10<=4&&(wives%100<10||wives%100>=20)?1:2)]} и #{children} #{["ребёнок","ребёнка","детей"][(children%10===1&&children%100!==11?0:children%10>=2&&children%10<=4&&(children%100<10||children%100>=20)?1:2)]}');
    },
    'output is vanilla jade': function(L) {
      var compile = require('jade').compile;
      var vars = {wives: 1, children: 0};
      equal(compile(L.get('user.family1'))(vars), "<You>'ve got 1 wife and 0 childre n'</You>");
      equal(compile(L.get('user.family2'))(vars), "<Tu>as 1 femme et 0 enfant</Tu>");
      equal(compile(L.get('user.family3'))(vars), "У тебя 1 жена и 0 детей\n");
    },
  },
  'locale honors non-standard tags': {
    topic: function () {
      var L = new Locale({
        tags: {
          open: '<%=',
          close: '%>'
        }
      });
      L.add('en', locales.en);
      L.add('fr', locales.fr);
      L.add('ru', locales.ru);
      return L;
    },
    'overriding works': function(L) {
      ok(L);
      ok(L.hash.foo);
      equal(L.hash.user.name, 'name');
      equal(L.hash.foo, locales.ru.foo);
    },
    'getter works': function(L) {
      ok(L);
      equal(L.get('user.name'), L.hash.user.name);
      equal(L.get('user').name, L.hash.user.name);
    },
    'compiler works': function(L) {
      ok(L);
      equal(L.get('user').family3, 'У тебя <%=wives%> <%=["жена","жены","жён"][(wives%10===1&&wives%100!==11?0:wives%10>=2&&wives%10<=4&&(wives%100<10||wives%100>=20)?1:2)]%> и <%=children%> <%=["ребёнок","ребёнка","детей"][(children%10===1&&children%100!==11?0:children%10>=2&&children%10<=4&&(children%100<10||children%100>=20)?1:2)]%>');
    },
    'output is vanilla micro-templating': function(L) {
      var compile = require('underscore').template;
      var vars = {wives: 2, children: 4};
      equal(compile(L.get('user.family1'))(vars), "You've got 2 wives and 4 childre n'");
      equal(compile(L.get('user.family2'))(vars), "Tu as 2 femmes et 4 enfants");
      equal(compile(L.get('user.family3'))(vars), "У тебя 2 жены и 4 ребёнка");
    },
  },
  'locale is compileable': {
    topic: function () {
      var L = new Locale({
        tags: {
          open: '<%=',
          close: '%>'
        },
        compiler: require('underscore').template
      });
      L.add('en', locales.en);
      L.add('fr', locales.fr);
      L.add('ru', locales.ru);
      return L;
    },
    'into template-neutral functions': function(L) {
      ok(L.options.compiler);
      equal(typeof L.get('user.family2'), 'function');
      equal(L.get('user.family2').length, 1);
    },
    'which return strings': function(L) {
      equal(L.get('user.family3')({wives: 5, children: 1001}), "У тебя 5 жён и 1001 ребёнок");
    },
  },
  'locale provides helper for templates': {
    topic: function () {
      var L = new Locale();
      L.add('en', locales.en, require('jade').compile);
      L.add('fr', locales.fr, require('jade').compile);
      L.add('ru', locales.ru, require('jade').compile);
      return L;
    },
    'into template-neutral functions': function(L) {
      equal(typeof L.get('foo'), 'function');
      equal(L.get('foo').length, 1);
    },
    'which return strings': function(L) {
      equal(L.t('user.family3', {wives: 1, children: 11}), "У тебя 1 жена и 11 детей\n");
    },
  },
  'locale honors': {
    topic: function () {
      var L = new Locale({
      });
      L.add('en', {
        foo: '#{a a}}|b}}|cc}}}}}'
      });
      return L;
    },
    'escaping': function(L) {
      ok(L);
      equal(L.hash.foo, '#{["a}","b}","cc}}"][(a===1?0:1)]}');
    },
  },
}).export(module);
