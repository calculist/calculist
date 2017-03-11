const expect = require('chai').expect
const calculist = require('./main')

const listData = {
  text: 'abc [=] sum($items, 0)',
  items: [
    {
      text: 'foo [=>] x | x + 1',
      items: []
    },
    {
      text: 'bar [=] foo(1)',
      items: []
    },
    {
      text: 'baz [:] 1',
      items: []
    }
  ]
}

describe('basic functionality', () => {

  it('is an object', () => {
    expect(calculist).to.be.an('object')
  });

  it('returns a document', () => {
    expect(calculist.new(listData)).to.be.an('object')
  })

  it('returns json', () => {
    let list = calculist.new(listData)
    expect(list.toJSON()).to.be.an('object')
  })

})

describe('basic calculation', () => {

  it('calculates plain values correctly', () => {
    let list = calculist.new({ text: 'foo [:] 1 + 1' })
    expect(list.valueOf()).to.eq('1 + 1')
  })

  it('calculates plain expressions correctly', () => {
    let list = calculist.new({ text: 'foo [=] 1 + 1' })
    expect(list.valueOf()).to.eq(2)
  })

  it('calculates functions correctly', () => {
    let list = calculist.new({ text: 'foo [=>] a, b | a + b' })
    expect(list.valueOf()(1, 1)).to.eq(2)
  })

  it('references variables correctly', () => {
    let list = calculist.new({
      text: 'foo bar [=] 5',
      items: [
        {text: 'baz [=] 2'},
        {text: '[=] foo_bar - baz'}
      ]
    })
    expect(list.$item(1).valueOf()).to.eq(5 - 2)
  })

  it('references variables with dot accessor correctly', () => {
    let list = calculist.new({
      text: 'foo',
      items: [
        {
          text: 'b',
          items: [{text: 'uzz [=] 9'}]
        },
        {text: 'fizz [=] b.uzz'}
      ]
    })
    expect(list.$item('fizz').valueOf()).to.eq(9)
  })

  it('references items with square bracket accessor correctly', () => {
    let list = calculist.new({
      text: 'foo',
      items: [
        {
          text: 'data',
          items: [{
            text: '1',
            items: [{text: 'a [=] 1.618'}, {text: 'b [=] -3'}]
          },{
            text: '2',
            items: [{
              text: 'a [=] 2.718'
            },{
              text: 'b [=] 42',
              items: [{ text: 'c [=] 256'}]
            }]
          },]
        },
        {text: 'result [=] sum(data["a"]) + sum(data["b"]["c"])'}
      ]
    })
    expect(list.$item('result').valueOf()).to.eq(1.618 + 2.718 + 256)
  })

  it('references `$name` correctly', () => {
    let list = calculist.new({ text: 'foo [=] $name + 1' })
    expect(list.valueOf()).to.eq('foo1')
  })

  it('references `$parent` correctly', () => {
    let list = calculist.new({
      text: 'foo [=] 1',
      items: [{
        text: 'child [=] $parent + 1'
      }]
    })
    expect(list.$item('child').valueOf()).to.eq(2)
  })

  it('references `$index` correctly', () => {
    let list = calculist.new({
      text: 'foo [=] 1',
      items: [{
        text: 'child 0 [=] $index'
      },{
        text: 'child 1 [=] $index'
      },{
        text: 'child 2 [=] $index'
      }]
    })
    list.items.forEach((item, index) => {
      expect(item.valueOf()).to.eq(index)
    })
  })

  it('calculates `sum($items)` correctly', () => {
    let list = calculist.new({
      text: 'foo [=] sum($items)',
      items: [
        {text: '[:] 1'},
        {text: '[:] 1'}
      ]
    })
    expect(list.valueOf()).to.eq(2)
  })

})

describe('math calculation', () => {

  const constants = ['E','LN2','LN10','LOG2E','LOG10E','PI','SQRT1_2','SQRT2']

  constants.forEach((constant) => {
    it(`includes the ${constant} constant`, () => {
      let list = calculist.new({
        text: `${constant} [=] ${constant}`,
      })
      expect(list.valueOf()).to.eq(Math[constant])
    })
  })

  const mathFunctions = ['abs','acos','acosh','asin','asinh','atan','atan2','atanh','cbrt','ceil','clz32','cos','cosh','exp','expm1','floor','fround','hypot','imul','log','log1p','log2','log10','pow','round','sign','sin','sinh','sqrt','tan','tanh','trunc']
  const multiArgumentMathFunctions = ['atan2','hypot','imul','pow']
  const specialCaseFunctions = ['acosh','random','gcd','lcm']
  const singleArgumentMathFunctions = mathFunctions.filter((fn) => !(multiArgumentMathFunctions.includes(fn) || specialCaseFunctions.includes(fn)))

  singleArgumentMathFunctions.forEach((fn) => {
    it(`includes the ${fn} function`, () => {
      let x = 0.123
      let list = calculist.new({
        text: `${fn} [=] ${fn}(${x})`,
      })
      expect(list.valueOf()).to.eq(Math[fn](x))
    })
  })

  multiArgumentMathFunctions.forEach((fn) => {
    it(`includes the ${fn} function`, () => {
      let x = 0.123
      let y = 0.456
      let list = calculist.new({
        text: `${fn} [=] ${fn}(${x}, ${y})`,
      })
      expect(list.valueOf()).to.eq(Math[fn](x, y))
    })
  })

  specialCaseFunctions.forEach((fn) => {
    it(`includes the ${fn} function`, () => {
      switch (fn) {
        case 'random':
          let random = calculist.new({ text: `random [=] random()` }).valueOf()
          expect(Math.floor(random)).to.eq(0)
          expect(Math.ceil(random)).to.eq(1)
          break
        case 'acosh':
          let acosh = calculist.new({ text: `acosh [=] acosh(PI)` }).valueOf()
          expect(acosh).to.eq(Math.acosh(Math.PI))
          break
        case 'gcd':
          let gcd = calculist.new({ text: `gcd [=] gcd(12, 16)` }).valueOf()
          expect(gcd).to.eq(4)
          let nonIntegerGCD = calculist.new({ text: `gcd [=] gcd(12.1, 16)` }).valueOf()
          expect(nonIntegerGCD).to.be.NaN
          break
        case 'lcm':
          let lcm = calculist.new({ text: `lcm [=] lcm(12, 16)` }).valueOf()
          expect(lcm).to.eq(48)
          let nonIntegerLCM = calculist.new({ text: `lcm [=] lcm(12.1, 16)` }).valueOf()
          expect(nonIntegerLCM).to.be.NaN
          break
        default:
          throw Error(`untested function ${fn}`)
          break
      }
    })
  })

})

describe('stats calculation', () => {

  const ss = require('simple-statistics')

  it('includes the min function', () => {
    let list = calculist.new({
      text: 'min [=] min($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(-1)
  })

  it('includes the max function', () => {
    let list = calculist.new({
      text: 'max [=] max($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(2)
  })

  it('includes the sum function', () => {
    let list = calculist.new({
      text: 'sum [=] sum($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(1)
  })

  it('includes the product function', () => {
    let list = calculist.new({
      text: 'product [=] product($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 3' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(-6)
  })

  it('includes the mean function', () => {
    let list = calculist.new({
      text: 'mean [=] mean($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(1 / 3)
  })

  it('includes the average function', () => {
    let list = calculist.new({
      text: 'average [=] average($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(1 / 3)
  })

  it('includes the median function', () => {
    let list = calculist.new({
      text: 'median [=] median($items)',
      items: [{ text: '[=] -1' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(0)
  })

  it('includes the mode function', () => {
    let list = calculist.new({
      text: 'mode [=] mode($items)',
      items: [{ text: '[=] 0' }, { text: '[=] 0' }, { text: '[=] 2' }, ]
    })
    expect(list.valueOf()).to.eq(0)
  })

  it('includes the quantile function', () => {
    let data = [-1, 0, 2]
    let list = calculist.new({
      text: 'quantile [=] quantile($items, 0.5)',
      items: data.map((d) => ({ text: `[=] ${d}` }))
    })
    expect(list.valueOf()).to.eq(ss.quantile(data, 0.5))
  })

  // sumNthPowerDeviations
  // zScore
  // rSquared
  // linearRegressionLine
  // tTest
  // tTestTwoSample
  // cumulativeStdNormalProbability
  // errorFunction
  // inverseErrorFunction
  // probit

  let singleFlatArrayFns = ['variance','sampleVariance','standardDeviation','sampleStandardDeviation',
                            'medianAbsoluteDeviation','interquartileRange','harmonicMean','geometricMean',
                            'rootMeanSquare','sampleSkewness']

  singleFlatArrayFns.forEach((fn) => {
    it(`includes the ${fn} function`, () => {
      let data = [1, 5, 2]
      let list = calculist.new({
        text: `${fn} [=] ${fn}($items)`,
        items: data.map((d) => ({ text: `[=] ${d}` }))
      })
      expect(list.valueOf()).to.eq(ss[fn](data))
    })
  })

  let doubleFlatArrayFns = ['sampleCorrelation','sampleCovariance']

  // binomialDistribution
  let singleNumberFns = ['bernoulliDistribution','poissonDistribution','factorial']

})
