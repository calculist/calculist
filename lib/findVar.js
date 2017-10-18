var _ = require('lodash');
var keyToVarName = require('./keyToVarName');

module.exports = function (graph) {
  graph.register('findVar', ['isItem'], function (isItem) {
    var varVal = function (item) {
      var val;
      if (item.hasVal) {
        val = item.valueOf();
        var loops = 0;
        while (val && isItem(val) && val.hasVal && ++loops < 100) {
          val = val.valueOf();
        }
      } else {
        val = item;
      }
      return val;
    };

    var findVar = function (item, varName) {
      if (!item.parent) return;
      var items = item.parent.items;
      var i = items.indexOf(item);
      while (--i >= 0) {
        if (keyToVarName(items[i].key) === varName) return varVal(items[i]);
      }
      if (keyToVarName(item.parent.key) === varName) return varVal(item.parent);
      return findVar(item.parent, varName);
    };

    return findVar;
  });
};
