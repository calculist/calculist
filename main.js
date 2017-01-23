var Item = require('./lib/item/Item');
var util = require('./lib/util');
var _ = require('lodash');

var calculist = {};

calculist.new = function (obj) {
  return new Item(obj);
};

calculist.toHTML = function (doc) {
  return '<div class="calculist-' + doc.guid + '"><ul>' + doc.toHTML() + '</ul></div>';
}

calculist.render = function (doc, containerElement) {
  containerElement.innerHTML = calculist.toHTML(doc);
}

try { module.exports = calculist; } catch (e) {}
try { window.calculist = calculist; } catch (e) {}
