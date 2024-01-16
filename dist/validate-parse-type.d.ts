type ValidateAtom = ((value: unknown) => boolean) & {
    message: string;
};
type ValidateFunc<T> = (parsed: T) => boolean;
type ValidateRule<T> = boolean | ValidateAtom | ValidateFunc<T>;
type ValidateRules<T> = {
    [key: string]: ValidateRule<T>;
};
type ValidateParser<T> = (() => unknown) | ((data: T) => unknown);
type ValidateConfig<T> = {
    parse?: ValidateParser<T>;
};
type AsyncValidateFunc<T> = (parsed: T) => Promise<boolean>;
type AsyncValidateRule<T> = ValidateRule<T> | AsyncValidateFunc<T>;
type AsyncValidateRules<T> = {
    [key: string]: AsyncValidateRule<T>;
};
type AsyncValidateParser<T> = ValidateParser<T> | (() => Promise<unknown>) | ((data: T) => Promise<unknown>);
type AsyncValidateConfig<T> = {
    parse?: AsyncValidateParser<T>;
};
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
declare function validate<T>(data: unknown, config: ValidateConfig<T> | ValidateRules<T>): Readonly<T>;
declare function validate<T>(data: unknown, config: AsyncValidateConfig<T> | AsyncValidateRules<T>): Promise<Readonly<T>>;
declare namespace validate {
    var unless: (...rules: ValidateAtom[] | [string, ...ValidateAtom[]]) => Record<string, ValidateAtom>;
    var isMissing: ValidateAtom;
    var isEmpty: ValidateAtom;
    var nonString: ValidateAtom;
    var nonBoolean: ValidateAtom;
    var nonNumber: ValidateAtom;
    var nonInteger: ValidateAtom;
    var nonObject: ValidateAtom;
    var nonFunction: ValidateAtom;
    var nonArray: ValidateAtom;
    var nonSingleArray: ValidateAtom;
    var nonCoupleArray: ValidateAtom;
    var nonTripleArray: ValidateAtom;
    var nonSingleOrCoupleArray: ValidateAtom;
    var nonSingleOrCoupleOrTripleArray: ValidateAtom;
    var nonCoupleOrTripleArray: ValidateAtom;
    var nonStringInArray: ValidateAtom;
    var nonBooleanInArray: ValidateAtom;
    var nonNumberInArray: ValidateAtom;
    var nonIntegerInArray: ValidateAtom;
    var nonArrayInArray: ValidateAtom;
    var nonObjectInArray: ValidateAtom;
    var nonFunctionInArray: ValidateAtom;
    var notOneOf: (values: unknown[] | Record<string, unknown>) => ValidateAtom;
}
export default validate;
declare const unless: (...rules: ValidateAtom[] | [string, ...ValidateAtom[]]) => Record<string, ValidateAtom>, isMissing: ValidateAtom, isEmpty: ValidateAtom, nonString: ValidateAtom, nonBoolean: ValidateAtom, nonNumber: ValidateAtom, nonInteger: ValidateAtom, nonObject: ValidateAtom, nonFunction: ValidateAtom, nonArray: ValidateAtom, nonSingleArray: ValidateAtom, nonCoupleArray: ValidateAtom, nonTripleArray: ValidateAtom, nonSingleOrCoupleArray: ValidateAtom, nonSingleOrCoupleOrTripleArray: ValidateAtom, nonCoupleOrTripleArray: ValidateAtom, nonStringInArray: ValidateAtom, nonBooleanInArray: ValidateAtom, nonNumberInArray: ValidateAtom, nonIntegerInArray: ValidateAtom, nonArrayInArray: ValidateAtom, nonObjectInArray: ValidateAtom, nonFunctionInArray: ValidateAtom, notOneOf: (values: unknown[] | Record<string, unknown>) => ValidateAtom;
export { validate, unless, isMissing, isEmpty, nonString, nonBoolean, nonNumber, nonInteger, nonObject, nonFunction, nonArray, nonSingleArray, nonCoupleArray, nonTripleArray, nonSingleOrCoupleArray, nonSingleOrCoupleOrTripleArray, nonCoupleOrTripleArray, nonStringInArray, nonBooleanInArray, nonNumberInArray, nonIntegerInArray, nonArrayInArray, nonObjectInArray, nonFunctionInArray, notOneOf, };
