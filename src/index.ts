type BuiltPattern = (value) => boolean

type PatternDefinition<T> = {
  build(pattern: T): BuiltPattern
  matches(pattern): boolean
}

export type MatchFunction = (value, ...extra) => any

export interface ConstructingPattern {
  (value, ...extra): any,
  when?(pattern, valueOrFunction): this
  default?(valueOrFunction?): MatchFunction
  match?: MatchFunction
  close?(): MatchFunction
}

export interface Pattern extends ConstructingPattern {
  when(pattern, valueOrFunction): this
  default(valueOrFunction?): MatchFunction
  match: MatchFunction
  close(): MatchFunction
}

const objectEntries = object => Object.keys(object).map(key => [key, object[key]])
const matches = value => pattern => pattern.matches(value)
const findAndBuild = pattern => findPattern(pattern).build(pattern)

const avaliblePatterns: PatternDefinition<any>[] = [
  {
    build: pattern => value => value === pattern,
    matches: pattern => typeof pattern === 'boolean'
                     || typeof pattern === 'number'
                     || typeof pattern === 'string'
                     || pattern === null
                     || pattern === undefined
                     ,
  },
  {
    build: pattern => {
      const patterns = pattern.map(findAndBuild)

      return value => value
                   && Array.isArray(patterns)
                   && value.length >= patterns.length
                   && patterns.every((matches, i) => matches(value[i]))
    },
    matches: pattern => Array.isArray(pattern),
  } as PatternDefinition<Array<PatternDefinition<any>>>,
  {
    build: pattern => value => typeof value === 'string' && pattern.test(value),
    matches: pattern => pattern instanceof RegExp,
  },
  {
    build: pattern => value => value instanceof pattern,
    matches: pattern => pattern && pattern[Symbol.species] !== undefined,
  },
  {
    build: pattern => value => (pattern === Boolean && typeof value === 'boolean')
                            || (pattern === Number && typeof value === 'number')
                            || (pattern === Object && typeof value === 'object' && value)
                            || (pattern === String && typeof value === 'string')
                            || value instanceof pattern
                            ,

    matches: pattern => pattern === Array
                     || pattern === Boolean
                     || pattern === Error
                     || pattern === Number
                     || pattern === Object
                     || pattern === String
                     ,
  },
  {
    build: pattern => {
      const patterns = objectEntries(pattern)
          .map(([key, pattern]) => [key, findAndBuild(pattern)] as [string, BuiltPattern])

      return value => {
        if (!value || typeof value !== 'object') return false

        const entries = objectEntries(value)

        return entries.length >= patterns.length
            && patterns.every(([patternKey]) => entries.some(([entryKey]) =>
                entryKey === patternKey))
            && patterns.every(([key, matches]) => matches(value[key]))
      }
    },
    matches: pattern => pattern
                     && typeof pattern === 'object'
                     && pattern.__proto__ === Object.prototype
                     ,
  },
  {
    build: pattern => value => pattern(value),
    matches: pattern => typeof pattern === 'function',
  },
]

function findPattern(pattern) {
  const foundPattern = avaliblePatterns.find(matches(pattern))

  if (!foundPattern) {
    throw Error(`No matching pattern for pattern ${pattern}`)
  }

  return foundPattern
}

export function pattern(): Pattern {
  const patterns: Array<{matches: BuiltPattern, value: any}> = []
  const noDefaultValue = {}
  let defaultValue: any = noDefaultValue

  const constructingPattern: ConstructingPattern = (value, ...extra) => {
    const matchingPattern = patterns.find(matches(value))

    if (!matchingPattern) {
      if (defaultValue === noDefaultValue) {
        throw Error(`MatchError: no pattern matches value ${value}`)
      }

      return typeof defaultValue === 'function'
        ? defaultValue(value, ...extra)
        : defaultValue
    }

    const {value: returnValue} = matchingPattern

    return typeof returnValue === 'function'
      ? returnValue(value, ...extra)
      : returnValue
  }

  constructingPattern.when = (pattern, value) => {
    const foundPattern = findPattern(pattern)
    const matches = foundPattern.build(pattern)

    patterns.push({matches, value})

    return constructingPattern
  }

  constructingPattern.default = value => {
    defaultValue = value

    return constructingPattern.close()
  }

  constructingPattern.match = (value, ...extra) => constructingPattern(value, ...extra)

  constructingPattern.close = () => (value, ...extra) => constructingPattern(value, ...extra)

  return constructingPattern as Pattern
}

export function match(value, patternBuilder: (Pattern) => void) {
  const match = pattern()
  patternBuilder(match)
  return match(value)
}

export const _ = () => true
export const some = value => value !== null && value !== undefined
export const none = value => value === null || value === undefined
export const either = (...patterns) => {
  patterns = patterns.map(findAndBuild)
  return value => patterns.some(matches => matches(value))
}
export const range = (start: number, end: number) => value => start <= value && value <= end
export const lt = (number: number) => value => value < number
export const lte = (number: number) => value => value <= number
export const gt = (number: number) => value => value > number
export const gte = (number: number) => value => value >= number
