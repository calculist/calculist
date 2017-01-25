var _ = require('lodash');

var callToJSON = _.method('toJSON');

module.exports = function () {
  return {
    text: this.text,
    items: _.map(this.items, callToJSON),
    collapsed: !!this.collapsed,
    sort_order: this.sort_order,
    guid: this.guid
  };
}
