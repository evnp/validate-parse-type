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

function validate<T>(
  data: unknown,
  config: ValidateConfig<T> | ValidateRules<T>
): Readonly<T>;
function validate<T>(
  data: unknown,
  config: AsyncValidateConfig<T> | AsyncValidateRules<T>
): Promise<Readonly<T>>;
function validate<T>(
  data: unknown,
  config: AsyncValidateConfig<T> | AsyncValidateRules<T>
): Readonly<T> | Promise<Readonly<T>> {
  let parseResult = null;
  let invalid = null;
  let infix = ": ";
  let suffix = "";
  let errorName = "";
  let errorMessage = "";

  const rules = Object.entries(config).reverse();
  let entry, message, rule;

  while ((entry = rules.pop())) {
    [message, rule] = entry;
    try {
      if (message === "parse") {
        const parser = rule;
        parseResult = typeof parser === "function" ? parser(data) : parser;
        if (isPromise(parseResult)) {
          return parseResult.then((result: T) =>
            validate(result, Object.fromEntries(rules))
          );
        }
      } else {
        const param = parseResult ?? data;
        let ruleResult = false;
        if (typeof rule === "function") {
          ruleResult = rule(param);
          if (isPromise(ruleResult)) {
            return parseResult.then((result: T) =>
              validate(result, Object.fromEntries(rules))
            );
          }
        } else if (Array.isArray(rule)) {
          // support arrays of rules:
          let subRuleResult = false;
          for (const subRule of rule) {
            subRuleResult = subRule(param);
            if (isPromise(subRuleResult)) {
              return parseResult.then((result: T) =>
                validate(result, Object.fromEntries(rules))
              );
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
      errorName = (error as Error)?.name ?? "Error";
      errorMessage = (error as Error)?.message ?? error?.toString() ?? "";
      infix = ` (${errorName}):`;
      suffix = `\n${errorMessage}`;
      break; // break out of loop as soon as unknown error occurs
    }
  }

  if (invalid) {
    throw new Error(invalid + infix + serialize(data) + suffix);
  }

  return Object.freeze(parseResult as T);
}

function isPromise(data: unknown) {
  return (
    (typeof data === "object" || typeof data === "function") &&
    typeof (data as Promise<unknown>)?.then === "function"
  );
}

function serialize(data: unknown) {
  const serialized = JSON.stringify(data, truncateStringReplacer);
  const serializedKeyQuotesRemoved = serialized.replace(/"(\w+)":/g, "$1:");
  return serializedKeyQuotesRemoved;
}

function truncateStringReplacer(key: string, value: unknown) {
  if (typeof value === "string") {
    return value.length > 16
      ? value.slice(0, 8) + "…" + value.slice(-8)
      : value;
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
validate.nonSingleOrCoupleOrTripleArray.message =
  "is not array of length one, two, or three";

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

validate.notOneOf = function (
  values: unknown[] | Record<string, unknown>
): ValidateAtom {
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
