var _ = require('lodash');

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

Item.prototype.initialize = require('./item.initialize');
Item.prototype.valueOf = require('./item.valueOf');
Item.prototype.$item = require('./item.$item');
Item.prototype.$$item = require('./item.$$item');
Item.prototype.toJSON = require('./item.toJSON');

module.exports = Item;
