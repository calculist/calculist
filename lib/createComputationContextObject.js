var _ = require('lodash');
var ss = require('simple-statistics');
var evalculist = require('evalculist');
var isItem = require('./item/isItem');
var keyToVarName = require('./keyToVarName');

module.exports = function (graph) {
  graph.register('createComputationContextObject', ['isItem','getItemByGuid'], function (isItem, getItemByGuid) {
    var itemMethods = ['$item', '$$item', '$siblings'];

    var fnToString = _.constant('[Function]');

    function ContextObject (item) {
      if (item) {
        var _this = this;
        _.each(itemMethods, function(method) {
          _this[method] = function () {
            return item[method].apply(item, arguments);
          };
          _this[method].toString = fnToString;
        });

        this.$parent = item.parent;
        this.$index = item.parent ? item.parent.items.indexOf(item) : 0;
        this.$items = item.items;
        this.$name = item.key;
        this.$guid = item.guid;
      }
    }

    var proto = ContextObject.prototype;

    var valIfItem = function (item) { return isItem(item) ? item.valueOf() : item; };
    var itemsIfItem = function (item) { return isItem(item) ? item.items : item; };
    var itemsFirst = function (fn) {
      return function () {
        arguments[0] = itemsIfItem(arguments[0]);
        return fn.apply(this, arguments);
      };
    };
    var allItemsAndValues = function (fn) {
      return function () {
        var i = arguments.length;
        while (--i >= 0) {
          arguments[i] = itemsIfItem(arguments[i]);
          if (_.isArray(arguments[i])) arguments[i] = _.map(arguments[i], proto.valueOf);
        }
        return fn.apply(this, arguments);
      };
    };

    var mathKeys = ['E','LN2','LN10','LOG2E','LOG10E','PI','SQRT1_2','SQRT2','abs','acos','acosh','asin','asinh','atan','atan2','atanh','cbrt','ceil','clz32','cos','cosh','exp','expm1','floor','fround','hypot','imul','log','log1p','log2','log10','max','min','pow','random','round','sign','sin','sinh','sqrt','tan','tanh','trunc'];
    var ssKeys = ['median','mode','product','variance','sampleVariance','standardDeviation','sampleStandardDeviation','medianAbsoluteDeviation','interquartileRange','harmonicMean','geometricMean','rootMeanSquare','sampleSkewness','factorial'];
    var lodashKeys = ['difference','intersection','reverse','union','uniq','xor',
                      'filter','find','findLast','map','reduce','zip','unzip',
                      'ceil','floor','max','min','round','clamp','inRange','range',
                      'camelCase','capitalize','kebabCase','lowerCase','join','split',
                      'parseInt','repeat','replace','snakeCase','split','startCase','toLower',
                      'toUpper','truncate','upperCase','words','times','identity'];
    _.each(mathKeys, function(key) { proto[key] = Math[key]; });
    _.each(ssKeys, function(key) { proto[key] = ss[key]; });
    _.each(lodashKeys, function (key) { proto[key] = _[key]; });

    var iterators = ['average','mean','median','mode','standardDeviation','products',
                    'unzip','filter','find','findLast','map','reduce','min','max','join'];

    _.each(iterators, function (methodName) {
      proto[methodName] = itemsFirst(proto[methodName]);
    });

    var doubleIterators = ['difference','intersection','union','xor','zip'];

    _.each(doubleIterators, function (methodName) {
      proto[methodName] = allItemsAndValues(proto[methodName]);
    });

    var conditionals = ['isArray','isNumber','isFunction','isString'];

    _.each(conditionals, function (methodName) {
      proto[methodName] = _.flow(valIfItem, _[methodName]);
    });

    proto.PLACEHOLDER = { toString: _.constant('[PLACEHOLDER]') };

    proto.partial = _.rest(function (fn, partialArgs) {
      var partialFn = _.rest(function (args) {
        var finalArgs = partialArgs.map(function (pArg) {
          if (pArg === proto.PLACEHOLDER) return args.shift();
          return pArg;
        }).concat(args);
        return fn.apply(null, finalArgs);
      });
      partialFn.toString = fnToString;
      return partialFn;
    });

    proto.average = proto.mean = itemsFirst(function (items, defaultValue) {
      return proto.sum(items, defaultValue) / items.length;
    });

    proto.sum = itemsFirst(function(items, defaultValue) {
      if (defaultValue != null) {
        return items.reduce(function(sum, item) {
          var val = item && item.valueOf();
          if (!_.isNumber(val) || _.isNaN(val)) val = defaultValue;
          return sum + val;
        }, 0);
      }
      return items.reduce(function(sum, item) {
        var val = item.valueOf();
        return sum + (_.isNumber(val) ? val : NaN);
      }, 0);
    });

    proto.quantile = itemsFirst(function (sample, p) {
      if (_.isNumber(p)) return ss.quantile(sample, p);
    });

    proto.interquartileRange = itemsFirst(function (items) {
      var values = _.map(items, valIfItem);
      return ss.interquartileRange(values);
    });

    proto.binomialCoefficient = function binomial(n, k) {
      // if ((typeof n !== 'number') || (typeof k !== 'number')) return false;
      var coeff = 1;
      for (var x = n-k+1; x <= n; x++) coeff *= x;
      for (x = 1; x <= k; x++) coeff /= x;
      return coeff;
    };
    proto.isInteger = function (n) { return _.isNumber(n) && n % 1 === 0; }
    proto.gcd = function (a, b) {
      var _gcd = function (a, b) { return b !== 0 ? _gcd(b, a % b) : a; };
      if (proto.isInteger(a) && proto.isInteger(b)) return _gcd(a, b);
      return NaN;
    };
    proto.lcm = function (a, b) { return Math.abs(a) * (Math.abs(b) / proto.gcd(a, b)); };
    proto.fraction = function (numerator, denominator) {
      if (denominator == null) denominator = 1;
      var ndec = numerator.toString().split('.')[1] || '';
      var ddec = denominator.toString().split('.')[1] || '';
      if (ndec || ddec) {
        var adjustor = Math.pow(10, Math.max(ndec.length, ddec.length));
        numerator = Math.round(numerator * adjustor);
        denominator = Math.round(denominator * adjustor);
      }
      var gcd = proto.gcd(numerator, denominator);
      return '' + (numerator / gcd) + '/' +  (denominator / gcd);
    };
    proto.wordCount = function (item) {
      var count = 0;
      var items = item;
      if (isItem(item)) {
        if (_.isUndefined(item.key)) item.valueOf();
        count = _.words('' + item.key + ' ' + (item.val || '')).length;
        items = item.items;
        if (items.length === 0) return count;
      } else if (!_.isArray(items)) {
        return _.words('' + item).length;
      }
      return _.reduce(items, function (sum, item) {
        return sum + proto.wordCount(item);
      }, count);
    };
    proto.mod = proto.modulo = function(a, b) { return (+a % (b = +b) + b) % b; };
    proto.polarToCartesian = function (r, theta) {
      var x = r * Math.cos(theta),
          y = r * Math.sin(theta);
      return [x, y];
    };
    proto.cartesianToPolar = function (x, y) {
      var r = Math.sqrt(x * x + y * y),
          theta = Math.atan(y / x);
      return [r, theta];
    };
    proto.degreesToRadians = function (degrees) {
      return (degrees / 360) * (2 * Math.PI);
    };

    proto.radiansToDegrees = function (radians) {
      return 360 * radians / (2 * Math.PI);
    };

    proto.length = proto.count = itemsFirst(_.property('length'));
    proto.name = proto.key = _.property('key');
    proto.valueOf = _.method('valueOf');
    proto.toString = _.method('toString');
    proto.recursiveCount = proto.rcount = itemsFirst(function (items) {
      return items.length + _.reduce(items, function (m, item) {
        return m + proto.recursiveCount(item.items);
      }, 0);
    });

    proto.true = true;
    proto.false = false;
    proto.null = null;

    proto.itemOf = function (item, name) {
      return item.$item(name);
    };
    proto.itemsOf = _.property('items');
    proto.nameOf = _.property('key');
    proto.parentOf = _.property('parent');
    proto.guidOf = _.property('guid');
    proto.indexOf = itemsFirst(function (array, item) {
      return array.indexOf(item);
    });
    proto.pluckItems = itemsFirst(function (items, key) {
      var condition;
      if (_.isFunction(key)) {
        condition = key;
      } else {
        condition = { key: key };
      }
      return items.reduce(function (pluckedItems, item) {
        var pluckedItem = _.find(item.items, condition);
        if (pluckedItem) pluckedItems.push(pluckedItem);
        return pluckedItems;
      }, []);
    });

    proto.flowMap = itemsFirst(function () {
      var fns = _.flatten(arguments);
      var fmap = _.rest(function (args) {
        return _.map(fns, function (fn) {
          return fn.valueOf().apply(null, args);
        });
      });
      fmap.toString = fnToString;
      return fmap;
    });

    proto.flow = itemsFirst(function () {
      var fns = _.flatten(arguments);
      var flow = function () {
        return _.reduce(fns, function (r, fn) {
          return [fn.valueOf().apply(null, r)];
        }, arguments)[0];
      };
      flow.toString = fnToString;
      return flow;
    });

    proto.compose = itemsFirst(function () {
      var fns = _.flatten(arguments);
      fns.reverse();
      return proto.flow(fns);
    });

    var curry2 = function (fn) {
      var fn0, fn1;
      fn0 = function () {
        if (arguments.length === 0) return fn0;
        var arg0 = arguments[0];
        fn1 = function (arg1) { return fn(arg0, arg1); };
        if (arguments.length > 1) return fn1(arguments[1]);
        fn1.toString = fnToString;
        return fn1;
      };
      fn0.toString = fnToString;
      return fn0;
    };

    proto.isEqualTo = proto.eq = curry2(function (b, a) { return a == b; });
    proto.isGreaterThan = proto.gt = curry2(function (b, a) { return a > b; });
    proto.isGreaterThanOrEqualTo = proto.gte = curry2(function (b, a) { return a >= b; });
    proto.isLessThan = proto.lt = curry2(function (b, a) { return a < b; });
    proto.isLessThanOrEqualTo = proto.lte = curry2(function (b, a) { return a <= b; });

    // TODO should these logic functions check and adapt to non-function arguments?
    proto.and = function () {
      var fns = _.flatten(arguments),
          and;
      and = function () {
        var args = arguments;
        return _.every(fns, function (fn) {
          return fn.valueOf().apply(null, args);
        });
      };
      and.toString = fnToString;
      return and;
    };

    proto.or = function () {
      var fns = _.flatten(arguments),
          or;
      or = function () {
        var args = arguments;
        return _.some(fns, function (fn) {
          return fn.valueOf().apply(null, args);
        });
      };
      or.toString = fnToString;
      return or;
    };

    proto.not = function (fn) {
      return function () {
        return !fn.valueOf().apply(null, arguments);
      };
    };

    proto.item = curry2(function (key, list) {
      if (isItem(list)) return list.$item(key);
      if (_.isNumber(key)) return list[key];
      var condition;
      if (_.isFunction(key)) {
        condition = key;
      } else {
        condition = { key: key };
      }
      return _.find(list, condition);
    });

    proto.global_item = function (key) {
      return window.topItem.$item(key);
    };

    proto.itemByGuid = function (guid) {
      return getItemByGuid(guid);
    };

    // evalculist adds a special "accessor" function for things like a['b']
    // so it becomes accessor(a, 'b')
    proto.accessor = function (obj, key) {
      if (_.isNumber(key) && !isItem(obj[key])) return obj[key];
      return proto.pluckItems(obj, key);
    };

    proto.dotAccessor = itemsFirst(function (items, key) {
      var item = _.findLast(items, function (item) {
        if (!item.key) item.valueOf();
        return keyToVarName(item.key) === key;
      });
      if (item && item.hasVal) return item.valueOf();
      return item;
    });

    proto.flatten = itemsFirst(function (items) {
      if (isItem(items[0])) {
        return _.reduce(items, function (flatItems, item) {
          flatItems.push(item);
          if (item.items.length) return flatItems.concat(proto.flatten(item));
          return flatItems;
        }, []);
      } else {
        return _.flatten(items);
      }
    });

    proto.uniq = proto.unique = itemsFirst(function (items) {
      items = _.map(items, proto.valueOf);
      return _.uniq(items);
    });

    proto.slice = itemsFirst(function (items, start, end) {
      var result = _.slice(items, start, end);
      if (_.isString(items)) return result.join('');
      return result;
    });

    proto.reverse = itemsFirst(function (items) {
      var result = _.reverse(_.toArray(items));
      if (_.isString(items)) return result.join('');
      return result;
    });

    _.each(proto, function (fn, key) {
      proto[_.snakeCase(key)] = fn;
      if (_.isFunction(fn)) fn.toString = fnToString;
    });

    return function (item) {
      return new ContextObject(item);
    };

  });
};
