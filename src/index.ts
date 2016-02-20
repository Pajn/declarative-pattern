type BuiltPattern = (value) => boolean

type PatternDefinition<T> = {
  build(pattern: T): BuiltPattern
  matches(pattern): boolean
}

export interface ConstructingPattern {
  (value): any,
  when?(pattern, valueOrFunction): this
  default?(valueOrFunction?): (value) => any
  match?(value): any
  close?(): (value) => any
}

export interface Pattern extends ConstructingPattern {
  when(pattern, valueOrFunction): this
  default(valueOrFunction?): (value) => any
  match(value): any
  close(): (value) => any
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

  const constructingPattern: ConstructingPattern = value => {
    const matchingPattern = patterns.find(matches(value))

    if (!matchingPattern) {
      if (defaultValue === noDefaultValue) {
        throw Error(`MatchError: no pattern matches value ${value}`)
      }

      return typeof defaultValue === 'function'
        ? defaultValue(value)
        : defaultValue
    }

    const {value: returnValue} = matchingPattern

    return typeof returnValue === 'function'
      ? returnValue(value)
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

  constructingPattern.match = value => constructingPattern(value)

  constructingPattern.close = () => value => constructingPattern(value)

  return constructingPattern as Pattern
}
