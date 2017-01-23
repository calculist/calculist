const expect = require('chai').expect
const calculist = require('./main')

describe('basic functionality', () => {
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

  it('calculates correctly', () => {
    let doc = calculist.new(listData)
    expect(doc.valueOf()).to.eq(3)
  })

})
