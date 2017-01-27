var _ = require('lodash');
var util = require('../util');

var prepareItems = function (items, _this) {
  return _.map(_.compact(items), function(item) {
    var newItemOptions = _.isPlainObject(item) ? _.clone(item) : item.toJSON();
    newItemOptions.parent = _this;
    newItemOptions.guid || (newItemOptions.guid = util.getNewGuid());
    return new _this.constructor(newItemOptions);
  });
};

var callDepth = 0;
var callValueOf = function (item) {
  item.valueOf();
  _.each(item.items, callValueOf);
};

module.exports = function(options) {
  this.guid = options.guid || util.getNewGuid();
  // if (itemsByGuid[this.guid] && itemsByGuid[this.guid] != this) {
  //   throw new Error('guids must be unique');
  // }
  // itemsByGuid[this.guid] = this;
  this.id || (this.id = _.uniqueId());
  this.text || (this.text = options.text || '');
  this.parent = options.parent;
  this.depth = this.parent ? this.parent.depth + 1 : 0;
  this.collapsed = options.collapsed && !!this.parent;
  this.sort_order = options.sort_order;
  ++callDepth;
  this.items = prepareItems(options.items, this);
  --callDepth;
  if (callDepth === 0) callValueOf(this);
};
