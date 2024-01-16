Validate · Parse · Type
-----------------------
These verbs have a kinship; performing them together enhances clarity, safety, and correctness of code.

Inspiration: [https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate "Parse, Don’t Validate by Alexis King")
<br>
(In spite of this excellent post's central message, I find `parse` written in code doesn't make _intent_ very clear. Instead, I'd remix from that message _Parse, AND Validate_ — and be clear both are happening when you do it!)

```
validate                = cultivate robust data logic leveraging terse-yet-readable validation
validate         + type = craft runtime guarantees that outside data matches types you cast to
validate + parse        = transform data, ensuring correctness before and after transformation
validate + parse + type = alongside transformations, encode type information as it is observed
```

`validate-parse-type` exports a single function — invoked as `validate<Type>({ parse: () => ... })` — which provides simple, ergonomic data correctness guarantees at the boundaries of your application. `validate` helps you know that the actual data you're working with matches the types you give it, without pulling in expensive schema-validation tooling to do so.

Function-centricity keeps `validate` lightweight [(<2kb gzipped)](https://github.com/evnp/validate-parse-type/blob/main/dist/validate-parse-type.min.js.gz "validate-parse-type.min.js.gz") but also powerful, and eminently flexible.

Installation
------------

```
npm install --save validate-parse-type
```
Then, in your Javascript or Typescript files:
```typescript
import validate from 'validate-parse-type';

// ~ alternately ~

import { validate } from 'validate-parse-type';

// ~ alternately ~

import { validate as nameOfYourChoice } from 'validate-parse-type';
```
All "atomic composition" functions (eg. `validate.unless(validate.isMissing)`) are
included under `validate` as a namespace, but you may import them as separate functions
if you wish:
```typescript
import { validate, unless, isMissing, /* etc. */ } from 'validate-parse-type';
```

Validate
--------

Pass data along with a mapping of validation messages to validator expressions:

```typescript
validate(data, { "data isn't correct": !isDataCorrect(data) });
// OR
validate(data, { "data isn't correct": () => !isDataCorrect(data) });
// OR
const validatedData = validate(data, {
  "data isn't an object": typeof data !== "object",
});
// OR
const validatedData = validate(data, {
  "data doesn't exist": !data,
  "data isn't an object": () => typeof data !== "object",
  "data isn't correct": !isDataCorrect(data),
});
```

If any validator express _is true_ or _returns true_, validation fails and an error
is raised containing the text of the corresponding validator mapping key, along
with a serialized form of the validated data which is useful for debugging.

Validator expressions must be either:
- A boolean value.
- A function that returns a boolean value.
This means you must sometimes cast to boolean using !! or Boolean(...).

Function validator expressions are useful for multiple reasons:
- They're evaluated one-at-a-time, in order of declaration, and short-circuit
  (meaning that only validators up to the first failing expression will execute).
- Logic within a subsequent validator function can depend on the success of a
  preceeding validator function, due to the properties described above.
- They can be executed _after_ parsing, thus operating on parsed/transformed data.

Parse
-----

Often when validating data, we want to also transform that data in some way related
to the validation taking place. It's advantageous to do this within a single
"atomic" function call instead of multiple steps, to avoid possible logic bugs.
You can add a parse step to any validate call by passing a parse function:

```typescript
const validatedParsedData = validate(data, {
  "data doesn't exist": !data,
  "data isn't an object": (originalData) => typeof originalData !== "object",
  parse: (data) => {
    return { abc: data.abc, xyz: data.x + data.y + data.z };
  },
  "only abc and xyz keys are allowed": (parsedData) => {
    return !parsedData.abc || !parsedData.xyz || Object.keys(parsedData) > 2;
  },
});
```

Any validator expressions that appear _before_ the parse function will be passed the
original, pre-parse data for validation. Those that appear _after_ the parse function
will be passed the resulting parsed data for validation.

Type
----

Almost always, when validating, our code "learns" new information about the data
being processed. If we don't do anything with this new information then we're
effectively throwing it away — apart from preventing bad-data bugs, our validation
can't have an effect on code running further along in the currrent codepath.

What can we do with this new information? We can channel it into the type system.
By casting to a more-specific type during the same, singular, validate/parse
operation, we convey new information about the data to future code — and type-
errors will tell us if the data does not meet future expectations.

Typing while you validate is very straightforward:

```typescript
type PositiveInteger<T extends number> = ${T} extends -${string} | ${string}.${string} ? never : T;
// See https://stackoverflow.com/a/69413070 for details of PostitiveInteger.

// Pass the desired result type as a type argument when calling validate:
const positiveIntegerArray = validate<PositiveInteger[]>(data, {
  "data isn't an array": !Array.isArray(data),
  parse: (data) => data.map(parseInt),
  "data contains a non-integer": (parsedData) => {
    return !parsedData.every((item) => Number.isInteger(item));
  },
  "data contains a negative integer": (parsedData) => {
    return !parsedData.every((item) => item > 0);
  },
});

// From this point onward in the codepath, the type system knows that
// positiveIntegerArray is an array of positive integers, and will help us
// accordingly. This knowledge is backed by actual runtime validation.
```

Further Examples
----------------

1. Basic validation:
```typescript
const data = response.data;
validate(data, {
  "Data is missing": typeof data === undefined,
  "Data is not a string": typeof data !== "string",
  "Data is empty": !data?.length,
});
// Can raise
// Error: Data is missing
// Error: Data is not a string
// Error: Data is empty
```

2. Validation with type-casting:
```typescript
const data = response.data;
const stringData = validate<string>(data, {
  "Data is missing": typeof data === undefined,
  "Data is not a string": typeof data !== "string",
  "Data is empty": !data?.length,
});
// Can raise
// Error: Data is missing
// Error: Data is not a string
// Error: Data is empty
```

3. Validate and parse:
```typescript
const data = response.data;
const stringValue = validate<string>(data, {
  parse: () => data.items[0].value,
  "Value is missing": (value) => typeof value !== undefined,
  "Value is not a string": (value) => typeof value !== "string",
  "Value is empty": (value) => !value.length,
});
// Can raise
// Error: Value is missing
// Error: Value is not a string
// Error: Value is empty
```

4. Validate data prior to parsing, and after parsing:
```typescript
const data = response.data;
const stringValue = validate<string>(data, {
  "Data is not an object": (data) => typeof data !== "object",
  parse: () => data.items[0].value,
  "Value is not a string": (value) => typeof value !== "string",
});
// Can raise
// Error: Data is not an object
// Error: Value is not a string
```

5. Use atomic composition to build conditions with consistent behavior and error messaging:
```typescript
const data = response.data;
const stringValue = validate<string>(data, {
  ...validate.unless("Data", validate.isMissing, validate.nonObject, validate.isEmpty),
  parse: () => data.items[0].value,
  ...validate.unless("Value", validate.isMissing, validate.nonString, validate.isEmpty),
});
// Can raise
// Error: Data is missing
// Error: Data is not an object
// Error: Data is empty
// Error: Value is missing
// Error: Value is not an object
// Error: Value is empty

// ~ alternately ~

const data = response.data;
const stringValue = validate<string>(data, {
  "Data is invalid": [validate.isMissing, validate.nonObject, validate.isEmpty],
  parse: () => data.items[0].value,
  "Value is invalid: [validate.isMissing, validate.nonString, validate.isEmpty],
});
// Can raise
// Error: Data is invalid
// Error: Value is invalid
// (error messages are not as granular in this form)
```

License
-------
MIT
