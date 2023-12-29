Validate · Parse · Type
-----------------------

A single function — `validate` — which provides simple-yet-ergonomic data correctness guarantees at the boundaries of your application. Know that the actual data you're working with matches the types you give it, without pulling in expensive schema-validation tooling to do so. Being function-centric makes `validate` lightweight, but also powerful and eminently flexible.

Installation
------------

```
npm install --save validate-parse-type
```
Then, in your Javascript or Typescript files:
```
import validate from 'validate-parse-type';
// or
import { validate } from 'validate-parse-type';
// or
import { validate as nameOfYourChoice } from 'validate-parse-type';
```
All atomic conditions are included under `validate` as a namespace (eg. `validate.unless(validate.isMissing)`) but you may import them as separate functions if you wish:
```
import { validate, unless, isMissing, /* etc. */ } from 'validate-parse-type';
```

Examples
--------
A utility in 5 use cases.

1. Bare validation:
```typescript
const data = response.data;
validate(data, {
  "Data is missing": typeof data === undefined,
  "Data is not a string": typeof data !== "string",
  "Data is empty": !data.length,
});
// Can raise
// Error: Data is missing
// Error: Data is not a string
// Error: Data empty
```

2. Validation with type-casting:
```typescript
const data = response.data;
const stringData = validate<string>(data, {
  "Data is missing": typeof data === undefined,
  "Data is not a string": typeof data !== "string",
  "Data is empty": !data.length,
});
// Can raise
// Error: Data is missing
// Error: Data is not a string
// Error: Data empty
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
// Error: Value empty
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

5. Compose conditions via atomic validation functions:
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

// ~ alternately ~ //

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

