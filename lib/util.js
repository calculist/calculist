var util = {};

util.getNewGuid = function() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function(n) {
    return (n ^ Math.random() * 16 >> n / 4).toString(16);
  });
};

module.exports = util;
