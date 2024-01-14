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

Examples
--------
A utility in 5 use cases.

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

