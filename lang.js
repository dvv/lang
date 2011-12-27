(function () { function require(p){ var path = require.resolve(p) , mod = require.modules[path]; if (!mod) throw new Error('failed to require "' + p + '"'); if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path)); } return mod.exports;}require.modules = {};require.resolve = function(path){ var orig = path , reg = path + '.js' , index = path + '/index.js'; return require.modules[reg] && reg || require.modules[index] && index || orig;};require.register = function(path, fn){ require.modules[path] = fn;};require.relative = function(parent) { return function(p){ if ('.' != p.charAt(0)) return require(p); var path = parent.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/')); };};require.register("plurals.js", function(module, exports, require){
'use strict';

/*
 * shamelessly taken from https://github.com/masylum/dialect/blob/master/lib/helpers/plurals.js.
 * Thank you, @masylum
 */

/* plurals.js provide functions that give you the plural index
 * for any locale.
 *
 * Usage:
 *  require('plurals')('es')(3) => 1;
 *  require('plurals')('es')(1) => 0;
 *
 * please, add your language if its not represented.
 *
 * references:
 *
 * http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
 * http://translate.sourceforge.net/wiki/l10n/pluralforms
 * http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms
 *
 */

module.exports = function plurals(locale) {
  var parts = locale.split('-');

  switch (locale) {

  // 1 Plural
  case 'ja':
  case 'vi':
  case 'ko':
    return function (n) {
      return 1;
    };

  // 2 Plurals
  case 'pt-BR':
  case 'fr':
    return function (n) {
      return n > 1 ? 1 : 0;
    };

  // 3 Plurals
  case 'lv':
    return function (n) {
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
    };
  case 'br':
  case 'ga':
  case 'gd':
  case 'cy':
    return function (n) {
      return n === 1 ? 0 : n === 2 ? 1 : 2;
    };
  case 'ro':
    return function (n) {
      return n === 1 ? 0 : (n === 0 || (n % 100 > 0 && n % 100 < 20)) ? 1 : 2;
    };
  case 'lt':
    return function (n) {
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
  case 'ru':
  case 'uk':
  case 'sr':
  case 'hr':
  case 'sh':
    return function (n) {
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
  case 'cs':
  case 'sk':
    return function (n) {
      return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
    };
  case 'pl':
    return function (n) {
      return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
  case 'mk':
    return function (n) {
      return n === 1 ? 0 : n % 10 >= 2 ? 1 : 2;
    };
  case 'sl':
    return function (n) {
      return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
    };

  // 2 Plurals
  default:
    if (parts.length === 2) {
      plurals(parts[0]);
    } else {
      return function (n) {
        return n === 1 ? 0 : 1;
      };
    }
  }
};

});require.register("index.js", function(module, exports, require){
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
  var re_interpolate1 = /#\{([\s\S]+?)\}/g;
  var re_interpolate2 = /%\{([\s\S]+?)\}:([\w.$]+)/g;

  var re_inflect = /^([\w.$]+?) +([\s\S]+)/;

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
        var m = re_inflect.exec(inner);
        if (m) {
          // unescape }} and parse word forms
          var forms = m[2].replace(re_unescape, '}').split('|');
          return '\',__p(' + m[1] + ',' + JSON.stringify(forms) + '),\'';
        // #{this.foo.bar} is sugar for this.t('foo.bar', locals)
        } else if (inner.indexOf('this.') === 0) {
          return '\',this.t("' + inner.substring(5) + '",locals),\'';
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

});require.register("compose.js", function(module, exports, require){
/*
* ComposeJS, object composition for JavaScript, featuring
* JavaScript-style prototype inheritance and composition, multiple inheritance,
* mixin and traits-inspired conflict resolution and composition
*/
'use strict';

// function for creating instances from a prototype
function Create() {}
var delegate = Object.create ?
function (proto) {
  return Object.create(typeof proto == "function" ? proto.prototype : proto || Object.prototype);
} : function (proto) {
  Create.prototype = typeof proto == "function" ? proto.prototype : proto;
  var instance = new Create();
  Create.prototype = null;
  return instance;
};

function validArg(arg) {
  if (!arg) {
    throw new Error("Compose arguments must be functions or objects");
  }
  return arg;
}
// this does the work of combining mixins/prototypes

function mixin(instance, args, i) {
  // use prototype inheritance for first arg
  var value, argsLength = args.length;
  for (; i < argsLength; i++) {
    var arg = args[i];
    if (typeof arg == "function") {
      // the arg is a function, use the prototype for the properties
      arg = arg.prototype;
      for (var key in arg) {
        value = arg[key];
        if (typeof value == "function" && key in instance && value !== instance[key]) {
          value = resolvePrototype(value, key, instance[key], arg.hasOwnProperty(key), instance);
        }
        if (value && value.install) {
          // apply modifier
          value.install.call(instance, key);
        } else {
          // augment existing hash with new hash
          if (instance[key] && typeof instance[key] === 'object' && value && typeof value === 'object') {
            Compose.call(instance[key], value);
            // add perform plain assignment
          } else {
            instance[key] = value;
          }
        }
      }
    } else {
      // it is an object, copy properties, looking for modifiers
      for (var key in validArg(arg)) {
        var value = arg[key];
        if (typeof value == "function") {
          if (value.install) {
            // apply modifier
            value.install.call(instance, key);
            continue;
          }
          if (key in instance) {
            if (value == required) {
              // required requirement met
              continue;
            }
            if (!value.overrides) {
              // add the overrides chain
              value.overrides = instance[key];
            }
          }
        }
        // augment existing hash with new hash
        if (instance[key] && typeof instance[key] === 'object' && value && typeof value === 'object') {
          Compose.call(instance[key], value);
          // add perform plain assignment
        } else {
          instance[key] = value;
        }
      }
    }
  }
  return instance;
}
// allow for override (by es5 module)
Compose._setMixin = function (newMixin) {
  mixin = newMixin;
};

function resolvePrototype(value, key, existing, own, instance) {
  if (value == required) {
    // it is a required value, and we have satisfied it
    return existing;
  } else if (own) {
    // if it is own property, it is considered an explicit override 
    if (!value.overrides) {
      // record the override hierarchy
      value.overrides = instance[key];
    }
  } else {
    // still possible conflict, see if either value is in the other value's override chain
    var overriden = value;
    while ((overriden = overriden.overrides) != existing) {
      if (!overriden) {
        // couldn't find existing in the provided value's override chain 
        overriden = existing;
        while ((overriden = overriden.overrides) != value) {
          if (!overriden) {
            // couldn't find value in the provided existing's override chain
            // we have a real conflict now
            existing = function () {
              throw new Error("Conflicted method, final composer must explicitly override with correct method.");
            }
            break;
          }
        }
        // use existing, since it overrides value
        value = existing;
        break;
      }
    }

  }
  return value;
}
Compose._resolvePrototype = resolvePrototype;

// Decorator branding

function Decorator(install) {
  function Decorator() {
    throw new Error("Decorator not applied");
  }
  Decorator.install = install;
  return Decorator;
}
Compose.Decorator = Decorator;
// aspect applier 

function aspect(handler) {
  return function (advice) {
    return Decorator(function (key) {
      var baseMethod = this[key];
      if (baseMethod && !(baseMethod.install)) {
        // applying to a plain method
        this[key] = handler(this, baseMethod, advice);
      } else {
        this[key] = Compose.around(function (topMethod) {
          baseMethod && baseMethod.install.call(this, key);
          return handler(this, this[key], advice);
        });
      }
    });
  };
};
// around advice, useful for calling super methods too
Compose.around = aspect(function (target, base, advice) {
  return advice.call(target, base);
});
Compose.before = aspect(function (target, base, advice) {
  return function () {
    var results = advice.apply(this, arguments);
    if (results !== stop) {
      return base.apply(this, results || arguments);
    }
  };
});
var stop = Compose.stop = {};
var undefined;
Compose.after = aspect(function (target, base, advice) {
  return function () {
    var results = base.apply(this, arguments);
    var adviceResults = advice.apply(this, arguments);
    return adviceResults === undefined ? results : adviceResults;
  };
});

// rename Decorator for calling super methods
Compose.from = function (trait, fromKey) {
  if (fromKey) {
    return (typeof trait == "function" ? trait.prototype : trait)[fromKey];
  }
  return Decorator(function (key) {
    if (!(this[key] = (typeof trait == "string" ? this[trait] : (typeof trait == "function" ? trait.prototype : trait)[fromKey || key]))) {
      throw new Error("Source method " + fromKey + " was not available to be renamed to " + key);
    }
  });
};

// Composes an instance
Compose.create = function (base) {
  // create the instance
  var instance = mixin(delegate(base), arguments, 1);
  var argsLength = arguments.length;
  // for go through the arguments and call the constructors (with no args)
  for (var i = 0; i < argsLength; i++) {
    var arg = arguments[i];
    if (typeof arg == "function") {
      instance = arg.call(instance) || instance;
    }
  }
  return instance;
}
// The required function, just throws an error if not overriden

function required() {
  throw new Error("This method is required and no implementation has been provided");
};
Compose.required = required;
// get the value of |this| for direct function calls for this mode (strict in ES5)

function extend() {
  var args = [this];
  args.push.apply(args, arguments);
  return Compose.apply(0, args);
}
// Compose a constructor

function Compose(base) {
  var args = arguments;
  var prototype = (args.length < 2 && typeof args[0] != "function") ? args[0] : // if there is just a single argument object, just use that as the prototype 
  mixin(delegate(validArg(base)), args, 1); // normally create a delegate to start with     

  function Constructor() {
    var instance;
    if (this instanceof Constructor) {
      // called with new operator, can proceed as is
      instance = this;
    } else {
      // we allow for direct calls without a new operator, in this case we need to
      // create the instance ourself.
      Create.prototype = prototype;
      instance = new Create();
    }
    // call all the constructors with the given arguments
    for (var i = 0; i < constructorsLength; i++) {
      var constructor = constructors[i];
      var result = constructor.apply(instance, arguments);
      if (typeof result == "object") {
        if (result instanceof Constructor) {
          instance = result;
        } else {
          for (var j in result) {
            if (result.hasOwnProperty(j)) {
              instance[j] = result[j];
            }
          }
        }
      }
    }
    return instance;
  }
  Constructor._getConstructors = function () {
    return constructors;
  };
  var constructors = getConstructors(arguments),
    constructorsLength = constructors.length;
  Constructor.extend = extend;
  if (!Compose.secure) {
    prototype.constructor = Constructor;
  }
  Constructor.prototype = prototype;
  return Constructor;
};

Compose.apply = function (thisObject, args) {
  // apply to the target
  return thisObject ? mixin(thisObject, args, 0) : // called with a target object, apply the supplied arguments as mixins to the target object
  extend.apply.call(Compose, 0, args); // get the Function.prototype apply function, call() it to apply arguments to Compose (the extend doesn't matter, just a handle way to grab apply, since we can't get it off of Compose) 
};
Compose.call = function (thisObject) {
  // call() should correspond with apply behavior
  return mixin(thisObject, arguments, 1);
};

function getConstructors(args) {
  // this function registers a set of constructors for a class, eliminating duplicate
  // constructors that may result from diamond construction for classes (B->A, C->A, D->B&C, then D() should only call A() once)
  var constructors = [];

  function iterate(args, checkChildren) {
    outer: for (var i = 0; i < args.length; i++) {
      var arg = args[i];
      if (typeof arg == "function") {
        if (checkChildren && arg._getConstructors) {
          iterate(arg._getConstructors()); // don't need to check children for these, this should be pre-flattened 
        } else {
          for (var j = 0; j < constructors.length; j++) {
            if (arg == constructors[j]) {
              continue outer;
            }
          }
          constructors.push(arg);
        }
      }
    }
  }
  iterate(args, true);
  return constructors;
}

// export
module.exports = Compose;

});Locale = require('index.js');
})();