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
            items: [{text: 'a [=] 2.718'}, {text: 'b [=] 42'}]
          },]
        },
        {text: 'result [=] sum(data["a"])'}
      ]
    })
    expect(list.$item('result').valueOf()).to.eq(1.618 + 2.718)
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
  const specialCaseFunctions = ['acosh','random']
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
      if (fn == 'random') {
        let list = calculist.new({
          text: `random [=] random()`,
        })
        expect(Math.floor(list.valueOf())).to.eq(0)
        expect(Math.ceil(list.valueOf())).to.eq(1)
      } else {
        let x = Math.PI
        let list = calculist.new({
          text: `${fn} [=] ${fn}(${x})`,
        })
        expect(list.valueOf()).to.eq(Math[fn](x))
      }
    })
  })

})

