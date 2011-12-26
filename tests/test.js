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
    bar: 'буй #{this.foo}',
    baz: 'буй #{this.user.family2}',
    user: {
      family3: 'У тебя #{wives} #{wives жена|жены|жён} и #{children} %{ребёнок}}|ребёнка}}}}|детей}}}}}}}:children',
    },
  },

};

$(document).ready(function () {

module('Locale');

test('smoke', function () {
  var L = new Locale();
  L.add('en', locales.en);
  L.add('fr', locales.fr);
  L.add('ru', locales.ru);
  ok(L);
  ok(L.foo);
  equal(L.user.name, 'name');
  equal(L.foo, locales.ru.foo);
  equal(L.get('user.name'), L.user.name);
  equal(L.get('user').name, L.user.name);
  equal(typeof L.get('user').name, 'string');
  equal(L.get('user').family3.toString().replace(/[\s]+/g, ''), 'function(){[nativecode]}');
  equal(L.get('user').family3.body, "var __p=this.p('ru');with(locals||{}){return ['У тебя ',wives,' ',__p(wives,[\"жена\",\"жены\",\"жён\"]),' и ',children,' ',__p(children,[\"ребёнок}\",\"ребёнка}}\",\"детей}}}\"]),''].join('')}");
  var vars = {wives: 2, children: 4};
  equal(L.get('user.family1')(vars), "You've got 2 wives and 4 childre n'");
  equal(L.user.family2(vars), "Tu as 2 femmes et 4 enfants");
  equal(L.t('user.family3', vars), "У тебя 2 жены и 4 ребёнка}}");
  equal(L.t('bar', vars), "буй фуй");
  equal(L.t('baz', vars), "буй Tu as 2 femmes et 4 enfants");
});

});
