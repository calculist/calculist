var _ = require('lodash');

module.exports = function (graph) {

  graph.register('Item', [], function () {
    var Item = function Item(obj) {
      this.initialize(obj);
    }

    Item.prototype.toHTML = function () {
      return '<li>' +
        '<span>' + this.text + '</span>' +
        '<ul>' + this.items.map(_.method('toHTML')).join('') + '</ul>' +
      '</li>'
    };

    Item.prototype.toString = function () {
      return '' + this._valueOf;
    };

    return Item;
  });

  graph.require(['Item', 'item'], function (Item, item) {
    _.extend(Item.prototype, item);
  });
};
