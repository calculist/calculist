var _ = require('lodash');

module.exports = function (graph) {
graph.register('item.$item', [], function () {
return function(key, attributeName) {
  attributeName || (attributeName = 'key');
  var condition;
  if (_.isNumber(key)) {
    var i = key;
    if (i < 0) i += this.items.length;
    return this.items[i];
  } else if (_.isFunction(key)) {
    condition = key;
  } else if (_.isRegExp(key)) {
    condition = function (child) { return key.test(child[attributeName]); };
  } else {
    condition = function (child) { return child[attributeName] === key; };
  }
  var item = null,
      children,
      nextChildren = this.items;
  while (!(item || nextChildren.length === 0)) {
    children = nextChildren;
    if (children.length) {
      nextChildren = [];
      item = _.find(children, function(child) {
        if (condition(child)) {
          return true;
        } else {
          nextChildren.push.apply(nextChildren, child.items);
          return false;
        }
      });
    }
  }
  return item;
};
});
};
