var _ = require('lodash');
var getNewDocumentGraph = require('./lib/getNewDocumentGraph');

var calculist = {};

calculist.new = function (obj) {
  var topItem;
  var graph = getNewDocumentGraph();
  graph.init(['Item'], function (Item) {
    topItem = new Item(obj);
  });
  return topItem;
};

calculist.toHTML = function (list) {
  return '<div class="calculist-' + list.guid + '"><ul>' + list.toHTML() + '</ul></div>';
}

calculist.render = function (list, containerElement) {
  containerElement.innerHTML = calculist.toHTML(list);
}

try { module.exports = calculist; } catch (e) {}
try { window.calculist = calculist; } catch (e) {}
