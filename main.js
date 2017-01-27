var Item = require('./lib/item/Item');
var _ = require('lodash');

var calculist = {};

calculist.new = function (obj) {
  return new Item(obj);
};

calculist.toHTML = function (list) {
  return '<div class="calculist-' + list.guid + '"><ul>' + list.toHTML() + '</ul></div>';
}

calculist.render = function (list, containerElement) {
  containerElement.innerHTML = calculist.toHTML(list);
}

try { module.exports = calculist; } catch (e) {}
try { window.calculist = calculist; } catch (e) {}
