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
declare function validate<T>(data: unknown, config: ValidateConfig<T> | ValidateRules<T>): Readonly<T>;
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
