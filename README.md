Pattern matching is a declarative way to check multiple conditionals. It's similar to a
switch-statement but is much more powerful and at the same time simpler as it does not support
fall-though which is a common source of error.

## Usage
```javascript
import {match, pattern, range} from 'declarative-pattern'

// Either build a pattern that can be stored and executed at a later time
const fib = pattern()
  .when(0, 0)
  .when(1, 1)
  .default(n => fib(n-1) + fib(n-2))

// Or match a value directly
const isWeekend = match(new Date().getDay(), p => p
  .when(0, false)
  .when(range(1, 5), true)
  .when(6, false))
```

Supported pattern types:
- Value literals  
  booleans, numbers, strings, null and undefined match the same value
- Types  
  Array, Boolean, Error, Number, Object, String will match any value of the corresponding type
- RegExp
  RegExps will be tested on the value beeing matched
- Array literals  
  An array literal will match arrays with at least the same length and every specified pattern
  must match the corresponding element of the value being matched
- Object literals  
  An object literal will match objects where all the specified properties match the corresponding pattern
- Functions
  Any function returning true or false can be used as a pattern, the matching value will be passed
  as the only argument

A default case can be added which will match otherwise unmatched values, if no default case exist
and no pattern matches an Error will be thrown.

### Provided pattern functions

#### _
_ will match any value
```javascript
import {pattern, _} from 'declarative-pattern'

pattern()
  .when([_, 2], 'The array have a length of two or more and the second element is 2')
```

### some
some will match everything but null and undefined
```javascript
import {pattern, some} from 'declarative-pattern'

pattern()
  .when(some, 'There is some value')
```

### none
none will match null and undefined
```javascript
import {pattern, none} from 'declarative-pattern'

pattern()
  .when(none, 'There is no value')
```

### either(...patterns)
either(...patterns) lets you match on two or more patterns
```javascript
import {pattern, either} from 'declarative-pattern'

pattern()
  .when(either(5, 10), 'The number is either a five or a six')
  .when(either(Boolean, Number), 'The value is either a boolean or a number')
```

### range(start, end)
range(start, end) matches numbers within a range from start to end
```javascript
import {pattern, range} from 'declarative-pattern'

pattern()
  .when(range(1, 10), 'The number is >= 1 and <= 10')
```

### lt(number)
lt(number) matches number less than number
```javascript
import {pattern, lt} from 'declarative-pattern'

pattern()
  .when(lt(10), 'The number < 10')
```

### lte(number)
lt(number) matches number less than or equal to number
```javascript
import {pattern, lte} from 'declarative-pattern'

pattern()
  .when(lte(10), 'The number <= 10')
```

### gt(number)
gt(number) matches number greater than number
```javascript
import {pattern, gt} from 'declarative-pattern'

pattern()
  .when(gt(10), 'The number > 10')
```

### gte(number)
gt(number) matches number greater than or equal to number
```javascript
import {pattern, gte} from 'declarative-pattern'

pattern()
  .when(gte(10), 'The number >= 10')
```

### What happens when a pattern matches?
If the value passed to a when or default is a function, it will be executed when that arm matches.
The value that was matched will be passed as the only argument to the function and the match
will return the return value of the function.
If the value passed to a when or default is not a function, the match will return the value directly.
