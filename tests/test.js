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

$(document).ready(function () {

module('Locale');

test('smoke', function () {
  var L = new Locale({
    tags: {
      open: '<%=',
      close: '%>'
    }
  });
  L.add('en', locales.en);
  L.add('fr', locales.fr);
  L.add('ru', locales.ru);
  ok(L);
  ok(L.hash.foo);
  equal(L.hash.user.name, 'name');
  equal(L.hash.foo, locales.ru.foo);
  equal(L.get('user.name'), L.hash.user.name);
  equal(L.get('user').name, L.hash.user.name);
  equal(L.get('user').family3, 'У тебя <%=wives%> <%=["жена","жены","жён"][(wives%10===1&&wives%100!==11?0:wives%10>=2&&wives%10<=4&&(wives%100<10||wives%100>=20)?1:2)]%> и <%=children%> <%=["ребёнок","ребёнка","детей"][(children%10===1&&children%100!==11?0:children%10>=2&&children%10<=4&&(children%100<10||children%100>=20)?1:2)]%>');
  var compile = _.template;
  var vars = {wives: 2, children: 4};
  equal(compile(L.get('user.family1'))(vars), "You've got 2 wives and 4 childre n'");
  equal(compile(L.get('user.family2'))(vars), "Tu as 2 femmes et 4 enfants");
  equal(compile(L.get('user.family3'))(vars), "У тебя 2 жены и 4 ребёнка");
});

test('compiler', function () {
  var L = new Locale({
    tags: {
      open: '<%=',
      close: '%>'
    },
    compiler: _.template
  });
  L.add('en', locales.en);
  L.add('fr', locales.fr);
  L.add('ru', locales.ru);
  equal(typeof L.get('user.family2'), 'function');
  equal(L.get('user.family2').length, 1);
  equal(L.t('user.family3', {wives: 5, children: 1001}), "У тебя 5 жён и 1001 ребёнок");
});

test('escaping', function () {
  var L = new Locale({});
  L.add('en', {
    foo: '%{a}}|b}}|cc}}}}}:a'
  });
  ok(L);
  equal(L.hash.foo, '#{["a}","b}","cc}}"][(a===1?0:1)]}');
});

});
