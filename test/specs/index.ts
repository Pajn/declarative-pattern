import {pattern} from 'declarative-pattern'
import {expect} from 'chai'
import {createMockFunction} from 'mocks'

describe('pattern', () => {
  it('should throw if no pattern matches', () => {
    expect(() => pattern().match('')).to.throw(/^MatchError/)
    expect(() => pattern()('')).to.throw(/^MatchError/)
    expect(() => pattern().when(1, 1).match('')).to.throw(/^MatchError/)
    expect(() => pattern().when(1, 1)('')).to.throw(/^MatchError/)
  })

  it('should throw if pattern is invalid', () => {
    expect(() => pattern().when(new Error(), null)).to.throw()
  })

  it('should not be possible to build on a closed pattern', () => {
    expect(pattern().close()['when']).to.be.undefined
    expect(pattern().default().when).to.be.undefined
  })

  it('should not throw with a default clause', () => {
    expect(pattern().default()('')).to.be.undefined
  })

  it('should return the default value when no pattern matches', () => {
    expect(pattern().default('default')('')).to.equal('default')
  })

  it('should call the default function with value when no pattern matches', () => {
    const defaultMock = createMockFunction().returns('default')

    expect(pattern().default(defaultMock)('value')).to.equal('default')
    expect(defaultMock.calls.length).to.equal(1)
    expect(defaultMock.calls[0].args).to.deep.equal(['value'])
  })

  it('should call the matching pattern function with value when a pattern matches', () => {
    const whenMock = createMockFunction().returns('pattern')

    expect(pattern().when(String, whenMock)('value')).to.equal('pattern')
    expect(whenMock.calls.length).to.equal(1)
    expect(whenMock.calls[0].args).to.deep.equal(['value'])
  })
})

describe('patterns', () => {
  describe('value patterns', () => {
    it('should support booleans', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when(false, miss)
        .when(true, hit)
        .match(true)

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })

    it('should support null', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when(undefined, miss)
        .when(null, hit)
        .match(null)

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })

    it('should support numbers', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when(2, miss)
        .when(1, hit)
        .match(1)

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })

    it('should support strings', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when('bar', miss)
        .when('foo', hit)
        .match('foo')

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })

    it('should support undefined', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when(null, miss)
        .when(undefined, hit)
        .match(undefined)

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })
  })

  describe('type patterns', () => {
    it('should support Array', () => {
      const match = pattern()
        .when(Array, true)
        .default(false)

      expect(match([])).to.be.true
      expect(match({})).to.be.false
    })

    it('should support Boolean', () => {
      const match = pattern()
        .when(Boolean, true)
        .default(false)

      expect(match(true)).to.be.true
      expect(match(false)).to.be.true
      expect(match({})).to.be.false
      expect(match(0)).to.be.false
    })

    it('should support Errors', () => {
      const match = pattern()
        // .when(TypeError, 'type')
        .when(Error, true)
        .default(false)

      expect(match(new Error())).to.be.true
      expect(match(new RangeError())).to.be.true
      // expect(match(new TypeError())).to.equal('type')
      expect(match({}), 'object literal').to.be.false
      expect(match(0), 'number').to.be.false
    })

    it('should support Number', () => {
      const match = pattern()
        .when(Number, true)
        .default(false)

      expect(match(1)).to.be.true
      expect(match(0)).to.be.true
      expect(match(true)).to.be.false
      expect(match(null)).to.be.false
    })

    it('should support Object', () => {
      const match = pattern()
        .when(Object, true)
        .default(false)

      expect(match([])).to.be.true
      expect(match({foo: 'bar'})).to.be.true
      expect(match(1)).to.be.false
      expect(match(null)).to.be.false
    })

    it('should support String', () => {
      const match = pattern()
        .when(String, true)
        .default(false)

      expect(match('')).to.be.true
      expect(match('foobar')).to.be.true
      expect(match(true)).to.be.false
      expect(match(null)).to.be.false
    })
  })

  describe('array patterns', () => {
    it('should support catching all arrays', () => {
      const match = pattern()
        .when([], true)
        .default(false)

      expect(match([])).to.be.true
      expect(match([1])).to.be.true
      expect(match([[], {}])).to.be.true
    })

    it('should not match non-arrays', () => {
      const match = pattern()
        .when([], true)
        .default(false)

      expect(match({})).to.be.false
      expect(match(false)).to.be.false
      expect(match(null)).to.be.false
    })

    it('should support nested pattens', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when([[]], miss)
        .when([{}], hit)
        .match([{}])

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })

    it('should require all elements to match', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when([2, 1], miss)
        .when([1, 1], miss)
        .when([2, 2], miss)
        .when([1, 2, 3], miss)
        .when([1, 2], hit)
        .match([1, 2])

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })
  })

  describe('object patterns', () => {
    it('should support catching all objects', () => {
      const match = pattern()
        .when({}, true)
        .default(false)

      expect(match({})).to.be.true
      expect(match([])).to.be.true
      expect(match({foo: 'bar'})).to.be.true
    })

    it('should not match non-objects', () => {
      const match = pattern()
        .when({}, true)
        .default(false)

      expect(match(1)).to.be.false
      expect(match(false)).to.be.false
      expect(match(null)).to.be.false
    })

    it('should support nested pattens', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when({prop: []}, miss)
        .when({prop: {}}, hit)
        .match({prop: {}})

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })

    it('should require all props to match', () => {
      const miss = createMockFunction()
      const hit = createMockFunction()

      pattern()
        .when({one: 2, two: 1}, miss)
        .when({one: 1, two: 1}, miss)
        .when({one: 2, two: 2}, miss)
        .when({one: 1, two: 2, three: 3}, miss)
        .when({one: 1, two: 2}, hit)
        .match({one: 1, two: 2})

      expect(miss.calls.length).to.equal(0)
      expect(hit.calls.length).to.equal(1)
    })
  })

  describe('integration', () => {
    it('fibonacci', () => {
      const fib = pattern()
        .when(0, 0)
        .when(1, 1)
        .default(n => fib(n - 1) + fib(n - 2))

      expect(fib(5)).to.equal(5)
      expect(fib(8)).to.equal(21)
    })
  })
})
