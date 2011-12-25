'use strict';

var C = require('./compose');
var plurals = require('./plurals');

//
// Locale
//

function Locale(options) {
  this.hash = {};
  this.options = C.call({
    tags: {
      open: '#{',
      close: '}'
    }
  }, options || {});
}

//
// add a `hash` of strings to the locale. `id` defines inflection type
// optional `compiler` specifies templating compiler function
//
Locale.prototype.add = function (id, hash, compiler) {

  var openTag = this.options.tags.open;
  var closeTag = this.options.tags.close;
  var compile = compiler || this.options.compiler || function (x) { return x; };

  // compose textual representation of inflection cases
  var pluralize = plurals(id).toString().replace(/^[\s\S]*return /, '(').replace(/;[\s\S]*$/, ')').replace(/ /g, '');

  //
  // JavaScript micro-templating, similar to John Resig's implementation
  //
  var re_interpolate = /#\{([\s\S]+?)\}/g;

  var re_inflect1 = /^([\w.$]+?) ([\s\S]+)/;
  var re_inflect2 = /([\s\S]+) ([\w.$]+?)$/;

  function expand(str) {
    var tmpl = String(str || '')
      .replace(re_interpolate, function (match, inner) {
        var m;
        if (m = re_inflect1.exec(inner)) {
          return openTag + JSON.stringify(m[2].split('|')) + "[" + pluralize.replace(/n/g, m[1]) + "]" + closeTag;
        } else if (m = re_inflect2.exec(inner)) {
          return openTag + JSON.stringify(m[1].split('|')) + "[" + pluralize.replace(/n/g, m[2]) + "]" + closeTag;
        } else {
          return openTag + inner + closeTag;
        }
      })
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
    return tmpl;
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
    return keys;
  }
  return fn(vars);
};

//
// module
//
module.exports = Locale;
