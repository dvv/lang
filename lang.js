'use strict';

var C = require('./compose');
var plurals = require('./plurals');
var compile = require('./compile');

var locales = {

  en: {
    foo: 'foo',
    bar: 'bar',
    user: {
      name: 'name',
      family1: 'You\'ve got #{wives} #{wives wife|wives} and #{children} #{child|childre n\'|kindern children}',
    },
  },

  fr: {
    foo: 'fou',
    user: {
      family2: 'Tu as #{wives} #{wives femme|femmes} et #{children} #{enfant|enfants children}',
    },
  },

  ru: {
    foo: 'фуй',
    bar: 'буй',
    user: {
      family3: 'У тебя #{wives} #{wives жена|жены|жён} и #{children} #{ребёнок|ребёнка|детей children}',
    },
  },

};

function inflect(plural, num, forms, options) {
  // get word forms
  // FIXME: \| should not be treated as delimiter
  forms = forms.split('|');
  // convert quantity to truly number
  num = +num;
  // get plural category
  var form_index = plural(num);
  // try to get categorized form, fallback to 'other' form, fallback to 'single' form, fallback to empty string
  var r = forms[form_index] || forms[1] || forms[0] || '';
  return r;
}

//
// Locale
//

function Locale(id, hash) {
  this.hash = {};
  this.add.apply(this, arguments);
}

Locale.prototype.add = function (id, hash) {
  var pluralize = plurals(id);

  function inflect(num, forms, options) {
    // get word forms
    // FIXME: \| should not be treated as delimiter
    forms = forms.split('|');
    // convert quantity to truly number
    num = +num;
    // get plural category
    var form_index = pluralize(num);
    // try to get categorized form, fallback to 'other' form, fallback to 'single' form, fallback to empty string
    var r = forms[form_index] || forms[1] || forms[0] || '';
    return r;
  }

  function flatten(o, path) {
    var i, p;
    for (i in o) {
      if (o.hasOwnProperty(i)) {
        p = path ? path + '.' + i : i;
        if (o[i] && typeof o[i] === 'object') {
          flatten(o[i], p);
        } else if (typeof o[i] === 'string') {
          o[i] = compile(o[i]);
          if (typeof o[i] === 'function') {
            o[i] = o[i].bind(null, inflect);
          }
        }
      }
    }
  }

  flatten(hash);
  C.call(this.hash, hash);
  return this;
};

//
// compose locale
//
var L = new Locale('en', locales.en);
L.add('fr', locales.fr);
L.add('ru', locales.ru);
//console.log(L.hash);

//
// test
//
var vars = {wives: 1, children: 0};
console.log(L.hash.user.family1(vars))
console.log(L.hash.user.family2(vars))
console.log(L.hash.user.family3(vars))

var vars = {wives: 2, children: 5};
console.log(L.hash.user.family1(vars))
console.log(L.hash.user.family2(vars))
console.log(L.hash.user.family3(vars))
