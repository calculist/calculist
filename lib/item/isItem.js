var Item = require('./Item');

module.exports = function (obj) {
  return obj && obj.constructor === Item;
};
