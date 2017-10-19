var Backbone = require('backbone');
var _ = require('lodash');

module.exports = function (graph) {
  graph.register('eventHub', [], function () {
    var eventHub = _.extend({}, Backbone.Events);
    return eventHub;
  });
};
