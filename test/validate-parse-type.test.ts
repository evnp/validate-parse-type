/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Some test cases require type errors to be ignored;
// these will employ @ts-ignore on a line-by-line basis
// and require typescript-eslint's aggressive restriction
// of these notations to be ignored ("ban-ts-comment").

import fc from "fast-check";

import { validate } from "../src/validate-parse-type";

const isStr = (value: unknown) => typeof value === "string";
const isNum = (value: unknown) => typeof value === "number";
const isInt = (value: unknown) => Number.isInteger(value);

describe("validate-parse-type", () => {
  describe("synchronous", () => {
    test("validate", () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          expect(validate(s, { "not str": !isStr(s) })).toBe(s);
          expect(validate(s, { "not str": () => !isStr(s) })).toBe(s);
          expect(validate(s, { "no len": !isInt(s.length) })).toBe(s);
          expect(validate(s, { "no len": () => !isInt(s.length) })).toBe(s);
          expect(validate(s, { "not str": validate.nonString })).toBe(s);
          expect(validate(s, validate.unless(validate.nonString))).toBe(s);
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": !isStr(s) })),
              fc.constant((s: string) => ({ "not str": () => !isStr(s) })),
              fc.constant((s: string) => ({ "no len": !isInt(s.length) })),
              fc.constant((s: string) => ({ "no len": () => !isInt(s.length) })),
              fc.constant(() => ({ "not str": validate.nonString })),
              fc.constant(() => validate.unless(validate.nonString))
            )
          ),
          (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));
            expect(validate(s, validators)).toBe(s);
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          expect(validate(n, { "not num": !isNum(n) })).toBe(n);
          expect(validate(n, { "not num": () => !isNum(n) })).toBe(n);
          expect(validate(n, { "not int": !isInt(n) })).toBe(n);
          expect(validate(n, { "not int": () => !isNum(n) })).toBe(n);
          expect(validate(n, { "not num": validate.nonNumber })).toBe(n);
          expect(validate(n, validate.unless(validate.nonNumber))).toBe(n);
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({ "not num": !isNum(n) })),
              fc.constant((n: number) => ({ "not num": () => !isNum(n) })),
              fc.constant((n: number) => ({ "not int": !isInt(n) })),
              fc.constant((n: number) => ({ "not int": () => !isInt(n) })),
              fc.constant(() => ({ "not num": validate.nonNumber })),
              fc.constant(() => validate.unless(validate.nonNumber))
            )
          ),
          (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));
            expect(validate(n, validators)).toBe(n);
          }
        )
      );
    });

    test("validate -> parse", () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (value: string) => value.toUpperCase();
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());
          expectParse(validate(s, { "not str": !isStr(s), parse }));
          expectParse(validate(s, { "not str": () => !isStr(s), parse }));
          expectParse(validate(s, { "no len": !isInt(s.length), parse }));
          expectParse(validate(s, { "no len": () => !isInt(s.length), parse }));
          expectParse(validate(s, { "not str": validate.nonString, parse }));
          expectParse(validate(s, { ...validate.unless(validate.nonString), parse }));
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": !isStr(s) })),
              fc.constant((s: string) => ({ "not str": () => !isStr(s) })),
              fc.constant((s: string) => ({ "no len": !isInt(s.length) })),
              fc.constant((s: string) => ({ "no len": () => !isInt(s.length) })),
              fc.constant(() => ({ "not str": validate.nonString })),
              fc.constant(() => validate.unless(validate.nonString))
            )
          ),
          (s, a) => {
            const parse = (value: string) => value.toUpperCase();
            const validators = Object.assign({}, ...a.map((v) => v(s)));
            expect(validate(s, { ...validators, parse })).toBe(s.toUpperCase());
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const parse = (value: number) => value * value;
          const expectParse = (value: number) => expect(value).toBe(n * n);
          expectParse(validate(n, { "not num": !isNum(n), parse }));
          expectParse(validate(n, { "not num": () => !isNum(n), parse }));
          expectParse(validate(n, { "not int": !isInt(n), parse }));
          expectParse(validate(n, { "not int": () => !isNum(n), parse }));
          expectParse(validate(n, { "not num": validate.nonNumber, parse }));
          expectParse(validate(n, { ...validate.unless(validate.nonNumber), parse }));
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({ "not num": !isNum(n) })),
              fc.constant((n: number) => ({ "not num": () => !isNum(n) })),
              fc.constant((n: number) => ({ "not int": !isInt(n) })),
              fc.constant((n: number) => ({ "not int": () => !isInt(n) })),
              fc.constant(() => ({ "not num": validate.nonNumber })),
              fc.constant(() => validate.unless(validate.nonNumber))
            )
          ),
          (n, a) => {
            const parse = (value: number) => value * value;
            const validators = Object.assign({}, ...a.map((v) => v(n)));
            expect(validate(n, { ...validators, parse })).toBe(n * n);
          }
        )
      );
    });

    test("parse -> validate", () => {
      expect("TODO").toBe("TODO");
    });

    test("validate -> parse -> validate", () => {
      expect("TODO").toBe("TODO");
    });
  });

  describe("asynchronous", () => {
    test("validate", () => {
      expect("TODO").toBe("TODO");
    });

    test("validate -> parse", () => {
      expect("TODO").toBe("TODO");
    });

    test("parse -> validate", () => {
      expect("TODO").toBe("TODO");
    });

    test("validate -> parse -> validate", () => {
      expect("TODO").toBe("TODO");
    });
  });
});
