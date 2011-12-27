'use strict';

var C = require('./compose');
var plurals = require('./plurals');

//
// curry function
//
var slice = Array.prototype.slice;
var nativeBind = Function.prototype.bind;
function bind(func, obj) {
  if (func.bind === nativeBind && nativeBind) {
    return nativeBind.apply(func, slice.call(arguments, 1));
  }
  var args = slice.call(arguments, 2);
  return function() {
    return func.apply(obj, args.concat(slice.call(arguments)));
  };
}

//
// Locale
//

function Locale() {
}

//
// get pluralize function
//
// FIXME: should bring rules in here
//
Locale.prototype.p = function (id) {
  // TODO: cache?
  var fn = plurals(id);
  return function(n, forms) {
    // TODO: consider guessing for languages with simple plural
    return forms[fn(n)] || forms[1] || forms[0] || '???';
  };
};

//
// add a `hash` of strings to the locale. `id` defines language
//
Locale.prototype.add = function (id, hash) {

  var self = this;

  //
  // JavaScript micro-templating, similar to John Resig's implementation
  //
  var re_interpolate1 = /#\{([\s\S]*?)\}/g;
  var re_interpolate2 = /%\{([\s\S]*?)\}:([a-zA-Z_$][\w.$]+)/g;

  var re_variable = /^\s*[a-zA-Z_$][\w.$]+\s*$/;
  var re_inflection = /^\s*([a-zA-Z_$][\w.$]+?) +([\s\S]+)/;

  function expand(str) {
    str = String(str || '');
    var interpolated = false;
    var nonce = '~~~' + Math.random().toString().substring(2) + '~~~';
    var re_unescape = new RegExp(nonce, 'g');
    var tmpl = "var __p=this.p('" + id + "');with(locals||{}){return ['" + str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      // }} are escaped to not interfere with closing }
      // FIXME: this is redundant for simple strings!
      .replace(/\}\}/g, nonce)
      // #{var forms...}
      .replace(re_interpolate1, function (match, inner) {
        interpolated = true;
        inner = inner.replace(/\\'/, "'");
        var m = re_inflection.exec(inner);
        if (m) {
          // unescape }} and parse word forms
          var forms = m[2].replace(re_unescape, '}').split('|');
          return '\',__p(' + m[1] + ',' + JSON.stringify(forms) + '),\'';
        // #{this.foo.bar} is sugar for this.t('foo.bar', locals)
        } else if (inner.indexOf('this.') === 0) {
          return '\',this.t("' + inner.substring(5) + '",locals),\'';
        // plain interpolation -- `inner` defines variable to put
        } else if (re_variable.exec(inner)) {
          return '\',' + inner + ',\'';
        // bad interpolation -- just strip it off of #{}
        } else {
          return '\',\'' + inner + '\',\'';
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
    //console.log(tmpl);
    if (interpolated) {
      var fn = bind((new Function('locals', tmpl)), self);
      fn.body = tmpl;
      return fn;
    } else {
      return str;
    }
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
          c[i] = expand(o[i], id);
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
  C.call(this, copy);

  return this;
};

//
// get a subtree of locale.
// honors dotted notation: `get('foo.bar.baz') === get('foo').bar.baz`
//
Locale.prototype.get = function (key) {
  var path = (key || '').split('.');
  var o = this;
  var p;
  while (o && (p = path.shift())) {
    o = o[p];
  }
  return o;
};

//
// evaluator helper
//
Locale.prototype.t = function (key, vars) {
  var fn = this.get(key);
  if (typeof fn === 'function') {
    return fn.call(this, vars);
  } else {
    return fn;
  }
};

//
// export subtree as string
//
// FIXME: this is crap, really. Find out another ways to deliver locales over the wire
//
Locale.prototype.export = function (key) {
  var scope = this.get(key);
  // FIXME: ensure JSON exists it browser
  return JSON.stringify(scope, function (key, value) {
    if (typeof value === 'function') {
      // N.B. we loose `this` here
      value = 'f' + value.body;
    } else if (typeof value === 'string') {
      value = 's' + value;
    } else {
      value = undefined;
    }
    return value;
  });
};

//
// module
//
module.exports = Locale;
