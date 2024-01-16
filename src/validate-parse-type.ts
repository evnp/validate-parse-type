type ValidateAtom = ((value: unknown) => boolean) & { message: string };

type ValidateFunc<T> = (parsed: T) => boolean;
type ValidateRule<T> = boolean | ValidateAtom | ValidateFunc<T>;
type ValidateRules<T> = { [key: string]: ValidateRule<T> };
type ValidateParser<T> = (() => unknown) | ((data: T) => unknown);
type ValidateConfig<T> = { parse?: ValidateParser<T> };

type AsyncValidateFunc<T> = (parsed: T) => Promise<boolean>;
type AsyncValidateRule<T> = ValidateRule<T> | AsyncValidateFunc<T>;
type AsyncValidateRules<T> = { [key: string]: AsyncValidateRule<T> };
type AsyncValidateParser<T> =
  | ValidateParser<T>
  | (() => Promise<unknown>)
  | ((data: T) => Promise<unknown>);
type AsyncValidateConfig<T> = { parse?: AsyncValidateParser<T> };

/** VALIDATION **
 *
 * Pass data along with a mapping of validation messages to validator expressions:
 *
 * validate(data, { "data isn't correct": !isDataCorrect(data) });
 * OR
 * validate(data, { "data isn't correct": () => !isDataCorrect(data) });
 * OR
 * const validatedData = validate(data, {
 *   "data isn't an object": typeof data !== "object",
 * });
 * OR
 * const validatedData = validate(data, {
 *   "data doesn't exist": !data,
 *   "data isn't an object": () => typeof data !== "object",
 *   "data isn't correct": !isDataCorrect(data),
 * });
 *
 * If any validator express IS TRUE or RETURNS TRUE, validation fails and an error
 * is raised containing the text of the corresponding validator mapping key, along
 * with a serialized form of the validated data which is useful for debugging.
 *
 * Validator expressions must be either:
 * - A boolean value.
 * - A function that returns a boolean value.
 * This means you must sometimes cast to boolean using !! or Boolean(...).
 *
 * Function validator expressions are useful for multiple reasons:
 * - They're evaluated one-at-a-time, in order of declaration, and short-circuit
 *   (meaning that only validators up to the first failing expression will execute).
 * - Logic within a subsequent validator function can depend on the success of a
 *   preceeding validator function, due to the properties described above.
 * - They can be executed _after_ parsing, thus operating on parsed/transformed data.
 *
 ** PARSING **
 *
 * Often when validating data, we want to also transform that data in some way related
 * to the validation taking place. It's advantageous to do this within a single
 * "atomic" function call instead of multiple steps, to avoid possible logic bugs.
 * You can add a parse step to any validate call by passing a parse function:
 *
 * const validatedParsedData = validate(data, {
 *   "data doesn't exist": !data,
 *   "data isn't an object": (originalData) => typeof originalData !== "object",
 *   parse: (data) => {
 *     return { abc: data.abc, xyz: data.x + data.y + data.z };
 *   },
 *   "only abc and xyz keys are allowed": (parsedData) => {
 *     return !parsedData.abc || !parsedData.xyz || Object.keys(parsedData) > 2;
 *   },
 * });
 *
 * Any validator expressions that appear BEFORE the parse function will be passed the
 * original, pre-parse data for validation. Those that appear AFTER the parse function
 * will be passed the resulting parsed data for validation.
 *
 ** TYPING **
 *
 * Almost always, when validating, our code "learns" new information about the data
 * being processed. If we don't do anything with this new information then we're
 * effectively throwing it away -- apart from preventing bad-data bugs, our validation
 * can't have an effect on code running further along in the currrent codepath.
 *
 * What can we do with this new information? We can channel it into the type system.
 * By casting to a more-specific type during the same, singular, validate/parse
 * operation, we convey new information about the data to future code -- and type-
 * errors will tell us if the data does not meet future expectations.
 *
 * Typing while you validate is very straightforward:
 *
 * type PositiveInteger<T extends number> = ${T} extends -${string} | ${string}.${string} ? never : T;
 * // see https://stackoverflow.com/a/69413070 for details of PostitiveInteger
 *
 * // Pass the desired result type as a type argument when calling validate:
 * const positiveIntegerArray = validate<PositiveInteger[]>(data, {
 *   "data isn't an array": !Array.isArray(data),
 *   parse: (data) => data.map(parseInt),
 *   "data contains a non-integer": (parsedData) => {
 *     return !parsedData.every((item) => Number.isInteger(item));
 *   },
 *   "data contains a negative integer": (parsedData) => {
 *     return !parsedData.every((item) => item > 0);
 *   },
 * });
 *
 * // From this point onward in the codepath, the type system knows that
 * // positiveIntegerArray is an array of positive integers, and will help us
 * // accordingly. This knowledge is backed by actual runtime validation.
 *
 **/
function validate<T>(data: unknown, config: ValidateConfig<T> | ValidateRules<T>): Readonly<T>;
function validate<T>(
  data: unknown,
  config: AsyncValidateConfig<T> | AsyncValidateRules<T>
): Promise<Readonly<T>>;
function validate<T>(
  data: unknown,
  config: AsyncValidateConfig<T> | AsyncValidateRules<T>
): Readonly<T> | Promise<Readonly<T>> {
  let parse = null;
  let result = null;
  let invalid = null;
  let infix = ": ";
  let suffix = "";

  const rules = Object.entries(config).reverse();
  let entry;
  let message: string;
  let rule;

  while ((entry = rules.pop())) {
    [message, rule] = entry;
    try {
      if (message === "parse") {
        parse = rule;
        result = typeof parse === "function" ? parse(data) : parse;
        if (
          // Check if result is promise:
          (typeof result === "object" || typeof result === "function") &&
          typeof (result as Promise<unknown>).then === "function"
        ) {
          return result.then((result: T) => validate(result, Object.fromEntries(rules)));
        }
      } else {
        const param = parse ? result : data;
        let ruleResult = false;
        if (typeof rule === "function") {
          ruleResult = rule(param);
          if (
            // Check if result is promise:
            (typeof ruleResult === "object" || typeof ruleResult === "function") &&
            typeof (ruleResult as Promise<boolean>).then === "function"
          ) {
            return (ruleResult as Promise<boolean>).then((result: boolean) => {
              if (result) {
                throw new Error(message + infix + serialize(data) + suffix);
              } else {
                return validate(param, Object.fromEntries(rules));
              }
            });
          }
        } else if (Array.isArray(rule)) {
          // support arrays of rules:
          let subRuleResult = false;
          for (const subRule of rule) {
            if (typeof subRule !== "function") {
              subRuleResult = subRule;
            } else {
              subRuleResult = subRule(param);
              if (
                // Check if result is promise:
                (typeof subRuleResult === "object" || typeof subRuleResult === "function") &&
                typeof (subRuleResult as Promise<boolean>).then === "function"
              ) {
                return (subRuleResult as Promise<boolean>).then((result: boolean) => {
                  if (result) {
                    throw new Error(message + infix + serialize(data) + suffix);
                  } else {
                    return validate(param, Object.fromEntries(rules));
                  }
                });
              }
            }
            if (subRuleResult) {
              ruleResult = subRuleResult;
              break;
            }
          }
        } else {
          ruleResult = rule;
        }
        if (ruleResult) {
          invalid = message;
          break; // break out of loop as soon as first invalid rule is reached
        }
      }
    } catch (error) {
      invalid = message === "parse" ? "Failed to parse result" : message;
      infix = " (" + ((error as Error)?.name ?? "Error") + "):";
      suffix = "\n" + ((error as Error)?.message ?? error?.toString()) ?? "";
      break; // break out of loop as soon as unknown error occurs
    }
  }

  if (invalid) {
    throw new Error(invalid + infix + serialize(data) + suffix);
  }

  return Object.freeze((parse ? result : data) as T);
}

function serialize(data: unknown) {
  const serialized = JSON.stringify(data, truncateStringReplacer);
  const serializedKeyQuotesRemoved = serialized.replace(/"(\w+)":/g, "$1:");
  return serializedKeyQuotesRemoved;
}

function truncateStringReplacer(key: string, value: unknown) {
  if (typeof value === "string") {
    return value.length > 16 ? value.slice(0, 8) + "…" + value.slice(-8) : value;
  } else {
    return value;
  }
}

validate.unless = function (
  ...rules: ValidateAtom[] | [string, ...ValidateAtom[]]
): Record<string, ValidateAtom> {
  let prefix = "";
  if (typeof rules[0] === "string") {
    prefix = `${rules[0]} `;
    rules = rules.slice(1) as ValidateAtom[];
  } else {
    rules = rules as ValidateAtom[];
  }
  return Object.fromEntries(
    rules.map((rule) => [
      prefix + (prefix.length ? rule.message.toLowerCase() : rule.message),
      rule,
    ])
  );
};

validate.isMissing = function (value: unknown) {
  return value === null || value === undefined;
} as ValidateAtom;
validate.isMissing.message = "is missing";

validate.isEmpty = function (value: unknown) {
  value = typeof value === "object" ? Object.keys(value as object) : value;
  return !(Array.isArray(value) || typeof value === "string") || !value.length;
} as ValidateAtom;
validate.isEmpty.message = "is empty";

validate.nonString = function (value: unknown) {
  return typeof value !== "string";
} as ValidateAtom;
validate.nonString.message = "is non-string";

validate.nonBoolean = function (value: unknown) {
  return typeof value !== "boolean";
} as ValidateAtom;
validate.nonBoolean.message = "is non-boolean";

validate.nonNumber = function (value: unknown) {
  return typeof value !== "number";
} as ValidateAtom;
validate.nonNumber.message = "is non-number";

validate.nonInteger = function (value: unknown) {
  return Number.isInteger(value);
} as ValidateAtom;
validate.nonInteger.message = "is non-integer";

validate.nonObject = function (value: unknown) {
  return typeof value !== "object";
} as ValidateAtom;
validate.nonObject.message = "is non-object";

validate.nonFunction = function (value: unknown) {
  return typeof value !== "function";
} as ValidateAtom;
validate.nonFunction.message = "is non-function";

validate.nonArray = function (value: unknown) {
  return !Array.isArray(value);
} as ValidateAtom;
validate.nonArray.message = "is non-array";

validate.nonSingleArray = function (value: unknown) {
  return !Array.isArray(value) || value.length !== 1;
} as ValidateAtom;
validate.nonSingleArray.message = "is not array of length one";

validate.nonCoupleArray = function (value: unknown) {
  return !Array.isArray(value) || value.length !== 2;
} as ValidateAtom;
validate.nonCoupleArray.message = "is not array of length two";

validate.nonTripleArray = function (value: unknown) {
  return !Array.isArray(value) || value.length !== 2;
} as ValidateAtom;
validate.nonTripleArray.message = "is not array of length three";

validate.nonSingleOrCoupleArray = function (value: unknown) {
  return !Array.isArray(value) || ![1, 2].includes(value.length);
} as ValidateAtom;
validate.nonSingleOrCoupleArray.message = "is not array of length one or two";

validate.nonSingleOrCoupleOrTripleArray = function (value: unknown) {
  return !Array.isArray(value) || ![1, 2, 3].includes(value.length);
} as ValidateAtom;
validate.nonSingleOrCoupleOrTripleArray.message = "is not array of length one, two, or three";

validate.nonCoupleOrTripleArray = function (value: unknown) {
  return !Array.isArray(value) || ![2, 3].includes(value.length);
} as ValidateAtom;
validate.nonCoupleOrTripleArray.message = "is not array of length two or three";

validate.nonStringInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonString);
} as ValidateAtom;
validate.nonStringInArray.message = "contains non-string item";

validate.nonBooleanInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonBoolean);
} as ValidateAtom;
validate.nonBooleanInArray.message = "contains non-boolean item";

validate.nonNumberInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonNumber);
} as ValidateAtom;
validate.nonNumberInArray.message = "contains non-number item";

validate.nonIntegerInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonInteger);
} as ValidateAtom;
validate.nonIntegerInArray.message = "contains non-integer item";

validate.nonArrayInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonArray);
} as ValidateAtom;
validate.nonArrayInArray.message = "contains non-array item";

validate.nonObjectInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonObject);
} as ValidateAtom;
validate.nonObjectInArray.message = "contains non-object item";

validate.nonFunctionInArray = function (value: unknown) {
  return !Array.isArray(value) || value.some(validate.nonObject);
} as ValidateAtom;
validate.nonFunctionInArray.message = "contains non-function item";

validate.notOneOf = function (values: unknown[] | Record<string, unknown>): ValidateAtom {
  values = Array.isArray(values) ? values : Object.values(values);
  function notOneOf(value: unknown) {
    return !Array.isArray(values) || !values.includes(value);
  }
  notOneOf.message = `is not one of ${serialize(values)}`;
  return notOneOf;
};

export default validate;

const {
  unless,
  isMissing,
  isEmpty,
  nonString,
  nonBoolean,
  nonNumber,
  nonInteger,
  nonObject,
  nonFunction,
  nonArray,
  nonSingleArray,
  nonCoupleArray,
  nonTripleArray,
  nonSingleOrCoupleArray,
  nonSingleOrCoupleOrTripleArray,
  nonCoupleOrTripleArray,
  nonStringInArray,
  nonBooleanInArray,
  nonNumberInArray,
  nonIntegerInArray,
  nonArrayInArray,
  nonObjectInArray,
  nonFunctionInArray,
  notOneOf,
} = validate;

export {
  validate,
  unless,
  isMissing,
  isEmpty,
  nonString,
  nonBoolean,
  nonNumber,
  nonInteger,
  nonObject,
  nonFunction,
  nonArray,
  nonSingleArray,
  nonCoupleArray,
  nonTripleArray,
  nonSingleOrCoupleArray,
  nonSingleOrCoupleOrTripleArray,
  nonCoupleOrTripleArray,
  nonStringInArray,
  nonBooleanInArray,
  nonNumberInArray,
  nonIntegerInArray,
  nonArrayInArray,
  nonObjectInArray,
  nonFunctionInArray,
  notOneOf,
};
