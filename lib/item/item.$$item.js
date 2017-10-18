module.exports = function (graph) {
graph.register('item.$$item', [], function () {
return function(key) {
  if (!this.parent) return;
  var items = this.parent.items;
  var i = items.indexOf(this);
  while (--i >= 0) {
    if (items[i].key === key) return items[i];
  }
  if (this.parent.key === key) return this.parent;
  return this.parent.$$item(key);
};
});
};
