'use strict';

var C = require('./compose');
var plurals = require('./plurals');

//
// Locale
//

function Locale(options) {
  this.hash = {};
  this.options = C.call({
  }, options || {});
}

//
// get pluralize function
//
Locale.prototype.p = function (id) {
  // TODO: cache?
  var fn = plurals(id);
  return function(n, forms) {
    // TODO: consider guessing for languages with simple plural
    return forms[fn(n)] || forms[0] || '';
  };
};

//
// add a `hash` of strings to the locale. `id` defines inflection type
// optional `compiler` specifies templating compiler function
//
Locale.prototype.add = function (id, hash, compiler) {

  var self = this;
  var compile = compiler || this.options.compiler || function (x) { return x; };

  //
  // JavaScript micro-templating, similar to John Resig's implementation
  //
  var re_interpolate1 = /#\{([\s\S]+?)\}/g;
  var re_interpolate2 = /%\{([\s\S]+?)\}:([\w.$]+)/g;

  var re_inflect = /^([\w.$]+?) +([\s\S]+)/;

  function expand(str) {
    str = String(str || '');
    var interpolated = false;
    var nonce = '~~~' + Math.random().toString().substring(2) + '~~~';
    var re_unescape = new RegExp(nonce, 'g');
    var tmpl = "var __p=this.p('" + id + "');with(obj||{}){return ['" + str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      // }} are escaped to not interfere with closing }
      // FIXME: this is redundant for simple strings!
      .replace(/\}\}/g, nonce)
      // #{var forms...}
      .replace(re_interpolate1, function (match, inner) {
        interpolated = true;
        inner = inner.replace(/\\'/, "'");
        var m = re_inflect.exec(inner);
        if (m) {
          // unescape }} and parse word forms
          var forms = m[2].replace(re_unescape, '}').split('|');
          return '\',__p(' + m[1] + ',' + JSON.stringify(forms) + '),\'';
        } else {
          return '\',' + inner + ',\'';
        }
      })
      // %{forms...}:var
      .replace(re_interpolate2, function (match, forms, variable) {
        interpolated = true;
        forms = forms.replace(/\\'/, "'");
        variable = variable.replace(/\\'/, "'");
        // unescape }} and parse word forms
        forms = forms.replace(re_unescape, '}').split('|');
        return '\',__p(' + variable + ',' + JSON.stringify(forms) + '),\'';
      })
      // unescape orphan }}
      .replace(re_unescape, '}')
      + "'].join('')}";
    //return interpolated ? tmpl : str;
    return interpolated ? (new Function('obj', tmpl)).bind(self) : str;
  }

  function clone(o, c, path) {
    var i, p;
    for (i in o) {
      if (o.hasOwnProperty(i)) {
        p = path ? path + '.' + i : i;
        if (o[i] && typeof o[i] === 'object') {
          c[i] = {};
          clone(o[i], c[i], p);
        } else if (typeof o[i] === 'string') {
          c[i] = compile(expand(o[i], id));
        } else {
          c[i] = o[i];
        }
        //c[p] = c[i];
      }
    }
  }
  var copy = {};
  clone(hash, copy);

  // augment current locale hash
  C.call(this.hash, copy);

  return this;
};

//
// get a subtree of locale.
// honors dotted notation: `get('foo.bar.baz') === get('foo').bar.baz`
//
Locale.prototype.get = function (key) {
  var path = (key || '').split('.');
  var o = this.hash;
  var p;
  while (o && (p = path.shift())) {
    o = o[p];
  }
  return o;
};

//
// helper
//
Locale.prototype.t = function (key, vars) {
  var fn = this.get(key);
  if (typeof fn !== 'function') {
    // TODO: if it's string, compile it and replace hash key. So called lazy caching
    return (new Function('obj', fn)).call(this, vars);
  }
  return fn.call(this, vars);
};

//
// module
//
module.exports = Locale;

var L = new Locale();
L.add('en', {foo:'You\'ve got #{wives} #{wives wife|wives} and #{children} %{child|childre n\'|kindern}:children'});
L.add('ru', {bar:'У тебя #{wives} #{wives   жена|жены|жён} и #{children} %{ребёнок}}|ребёнка}}}}|детей}}}}}}}:children'});
L.add('fr', {baz:'C\'est une texte simple'});
L.add('fr', {buu:'C\'est une texte simple. Plus, reused #{this.hash.bar(obj)}'});
console.log(L.get('foo').toString());
console.log(L.get('bar').toString());
//console.log((new Function('obj', L.get('foo'))).call(L, {wives: 2, children: 5}));
console.log(L.t('bar', {wives: 2, children: 5}));
console.log(L.get('baz'));
console.log(L.get('foo')({wives: 1, children: 1}));
console.log(L.hash.bar({wives: 5, children: 101}));
console.log(L.hash.buu({wives: 1, children: 11}));
