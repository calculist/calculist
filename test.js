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
    let doc = calculist.new(listData)
    expect(doc.toJSON()).to.be.an('object')
  })

})

describe('calculation', () => {

  it('calculates plain values correctly', () => {
    let doc = calculist.new({ text: 'foo [:] 1 + 1' })
    expect(doc.valueOf()).to.eq('1 + 1')
  })

  it('calculates plain expressions correctly', () => {
    let doc = calculist.new({ text: 'foo [=] 1 + 1' })
    expect(doc.valueOf()).to.eq(2)
  })

  it('calculates functions correctly', () => {
    let doc = calculist.new({ text: 'foo [=>] a, b | a + b' })
    expect(doc.valueOf()(1, 1)).to.eq(2)
  })

  it('references variables correctly', () => {
    let doc = calculist.new({
      text: 'foo bar [=] 5',
      items: [
        {text: 'baz [=] 2'},
        {text: '[=] foo_bar - baz'}
      ]
    })
    expect(doc.$item(1).valueOf()).to.eq(5 - 2)
  })

  it('references `$name` correctly', () => {
    let doc = calculist.new({ text: 'foo [=] $name + 1' })
    expect(doc.valueOf()).to.eq('foo1')
  })

  it('calculates `sum($items)` correctly', () => {
    let doc = calculist.new({
      text: 'foo [=] sum($items)',
      items: [
        {text: '[:] 1'},
        {text: '[:] 1'}
      ]
    })
    expect(doc.valueOf()).to.eq(2)
  })

})
