module.exports = function (graph) {
  graph.register('somethingHasChanged', [], function () {
    // NOTE This is a placeholder function until we figure out
    // the correct logic for an isomorphic, multi-list context.
    return function () { return true; };
  });
};
