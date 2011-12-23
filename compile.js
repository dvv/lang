'use strict';

/***
var re_interpolate = /#\{([\s\S]+?)\}/g;
var re_inflect = /#\{([\s\S]+?) ([\s\S]+?)\}/g;

function template(str, data) {
  var tmpl = 'var __p=[];' +
    'with(obj||{}){__p.push(\'' +
    String(str||'')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(re_interpolate, function(match, inner) {
        return "'," + inner.replace(/\\'/g, "'") + ",'";
      })
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      + "');}return __p.join('');";
  console.log('FUN', tmpl);
  var func = new Function('obj', tmpl);
  if (data) return func(data);
  return function(data) {
    return func.call(this, data);
  };
}
***/


//
// JavaScript micro-templating, similar to John Resig's implementation
//
var re_interpolate = /#\{([\s\S]+?)\}/g;

var re_inflect1 = /^([\w.$]+?) ([\s\S]+)/;
var re_inflect2 = /([\s\S]+) ([\w.$]+?)$/;

function compile(str, data) {
  var interpolated = false;
  var tmpl = 'var __p=[];' +
    'with(obj||{}){__p.push(\'' +
    String(str||'')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(re_interpolate, function(match, inner) {
        interpolated = true;
        var m;
        if (m = re_inflect1.exec(inner)) {
          return "',p(" + m[1] + "," + JSON.stringify(m[2]) + "),'";
        } else if (m = re_inflect2.exec(inner)) {
          return "',p(" + m[2] + "," + JSON.stringify(m[1]) + "),'";
        } else {
          return "'," + inner.replace(/\\'/g, "'") + ",'";
        }
      })
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      + "');}return __p.join('');";
  if (interpolated) {
    //console.log('FUN', tmpl);
    var func = new Function('p, obj', tmpl);
    return func;
    /*return function() {
      return func.apply(this, arguments);
    };*/
  } else {
    return str;
  }
}

//
// export
//
module.exports = compile;
