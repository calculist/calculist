var acyclic = require('acyclic');

var Item = require('./item/Item');
var getItemByGuid = require('./item/getItemByGuid');
var isItem = require('./item/isItem');
var $$item = require('./item/item.$$item');
var $item = require('./item/item.$item');
var initialize = require('./item/item.initialize');
var toJSON = require('./item/item.toJSON');
var valueOf = require('./item/item.valueOf');

var computeItemValue = require('./computeItemValue');
var createComputationContextObject = require('./createComputationContextObject');
var findVar = require('./findVar');
var somethingHasChanged = require('./somethingHasChanged');


module.exports = function () {
  var graph = acyclic.new();
  var itemsByGuid = {};
  graph.register('itemsByGuid', [], function () { return itemsByGuid; });
  Item(graph);
  getItemByGuid(graph);
  isItem(graph);
  $$item(graph);
  $item(graph);
  initialize(graph);
  toJSON(graph);
  valueOf(graph);

  computeItemValue(graph);
  createComputationContextObject(graph);
  findVar(graph);
  somethingHasChanged(graph);

  return graph;
};
