module.exports = function (graph) {
  graph.register('isItem', ['Item'], function (Item) {
    return function (obj) { return obj && obj.constructor === Item; };
  });
};
