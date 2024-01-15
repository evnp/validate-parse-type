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
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (value: string) => value.toUpperCase();
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());
          expectParse(validate(s, { parse, "not str": !isStr(s) }));
          expectParse(validate(s, { parse, "not str": () => !isStr(s) }));
          expectParse(validate(s, { parse, "no len": !isInt(s.length) }));
          expectParse(validate(s, { parse, "no len": () => !isInt(s.length) }));
          expectParse(validate(s, { parse, "not str": validate.nonString }));
          expectParse(validate(s, { parse, ...validate.unless(validate.nonString) }));
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
            expect(validate(s, { parse, ...validators })).toBe(s.toUpperCase());
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const parse = (value: number) => value * value;
          const expectParse = (value: number) => expect(value).toBe(n * n);
          expectParse(validate(n, { parse, "not num": !isNum(n) }));
          expectParse(validate(n, { parse, "not num": () => !isNum(n) }));
          expectParse(validate(n, { parse, "not int": !isInt(n) }));
          expectParse(validate(n, { parse, "not int": () => !isNum(n) }));
          expectParse(validate(n, { parse, "not num": validate.nonNumber }));
          expectParse(validate(n, { parse, ...validate.unless(validate.nonNumber) }));
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
            expect(validate(n, { parse, ...validators })).toBe(n * n);
          }
        )
      );
    });

    test("validate -> parse -> validate", () => {
      function suffix(obj: object, suf: string) {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k + suf, v]));
      }
      function parseStrBetween(parse: (value: string) => string, validators: Record<string, unknown>) {
        return { ...suffix(validators, " (pre-parse)"), parse, ...suffix(validators, " (post-parse)") };
      }
      function parseNumBetween(parse: (value: number) => number, validators: Record<string, unknown>) {
        return { ...suffix(validators, " (pre-parse)"), parse, ...suffix(validators, " (post-parse)") };
      }
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (value: string): string => value.toUpperCase();
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());
          expectParse(validate(s, parseStrBetween(parse, { "not str": !isStr(s) })));
          expectParse(validate(s, parseStrBetween(parse, { "not str": () => !isStr(s) })));
          expectParse(validate(s, parseStrBetween(parse, { "not str": validate.nonString })));
          expectParse(validate(s, parseStrBetween(parse, { "no len": !isInt(s.length) })));
          expectParse(validate(s, parseStrBetween(parse, { "no len": () => !isInt(s.length) })));
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
            expect(validate(s, parseStrBetween(parse, validators))).toBe(s.toUpperCase());
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const parse = (value: number) => value * value;
          const expectParse = (value: number) => expect(value).toBe(n * n);
          expectParse(validate(n, parseNumBetween(parse, { "not num": !isNum(n) })));
          expectParse(validate(n, parseNumBetween(parse, { "not num": () => !isNum(n) })));
          expectParse(validate(n, parseNumBetween(parse, { "not int": !isInt(n) })));
          expectParse(validate(n, parseNumBetween(parse, { "not int": () => !isNum(n) })));
          expectParse(validate(n, parseNumBetween(parse, { "not num": validate.nonNumber })));
          expectParse(validate(n, parseNumBetween(parse, { ...validate.unless(validate.nonNumber) })));
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
            expect(validate(n, parseNumBetween(parse, validators))).toBe(n * n);
          }
        )
      );
    });
  });

  describe("asynchronous", () => {
    async function wait<T>(then: () => T): Promise<T> {
      await new Promise((r) => setTimeout(r, 1));
      return then();
    }

    test("validate", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          expect(await validate(s, { "not str": async () => await wait(() => !isStr(s)) })).toBe(s);
          expect(await validate(s, { "no len": async () => await wait(() => !isInt(s.length)) })).toBe(s);
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": async () => await wait(() => !isStr(s)) })),
              fc.constant((s: string) => ({ "no len": async () => await wait(() => !isInt(s.length)) })),
              // Combine with various non-async validators:
              fc.constant((s: string) => ({ "not str": !isStr(s) })),
              fc.constant((s: string) => ({ "not str": () => !isStr(s) })),
              fc.constant((s: string) => ({ "no len": !isInt(s.length) })),
              fc.constant((s: string) => ({ "no len": () => !isInt(s.length) })),
              fc.constant(() => ({ "not str": validate.nonString })),
              fc.constant(() => validate.unless(validate.nonString))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));
            expect(await validate(s, validators)).toBe(s);
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          expect(await validate(n, { "not num": async () => await wait(() => !isNum(n)) })).toBe(n);
          expect(await validate(n, { "not int": async () => await wait(() => !isInt(n)) })).toBe(n);
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({ "not num": async () => await wait(() => !isNum(n)) })),
              fc.constant((n: number) => ({ "not int": async () => await wait(() => !isInt(n)) })),
              // Combine with various non-async validators:
              fc.constant((n: number) => ({ "not num": !isNum(n) })),
              fc.constant((n: number) => ({ "not num": () => !isNum(n) })),
              fc.constant((n: number) => ({ "not int": !isInt(n) })),
              fc.constant((n: number) => ({ "not int": () => !isInt(n) })),
              fc.constant(() => ({ "not num": validate.nonNumber })),
              fc.constant(() => validate.unless(validate.nonNumber))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));
            expect(await validate(n, validators)).toBe(n);
          }
        )
      );
    });

    test("validate -> parse", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());

          const sParse = (value: string) => value.toUpperCase();
          expectParse(await validate(s, { "not str": async () => await wait(() => !isStr(s)), parse: sParse }));
          expectParse(await validate(s, { "no len": async () => await wait(() => !isInt(s.length)), parse: sParse }));

          const aParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(await validate(s, { "not str": async () => await wait(() => !isStr(s)), parse: aParse }));
          expectParse(await validate(s, { "no len": async () => await wait(() => !isInt(s.length)), parse: aParse }));
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": async () => await wait(() => !isStr(s)) })),
              fc.constant((s: string) => ({ "no len": async () => await wait(() => !isInt(s.length)) })),
              // Combine with various non-async validators:
              fc.constant((s: string) => ({ "not str": !isStr(s) })),
              fc.constant((s: string) => ({ "not str": () => !isStr(s) })),
              fc.constant((s: string) => ({ "no len": !isInt(s.length) })),
              fc.constant((s: string) => ({ "no len": () => !isInt(s.length) })),
              fc.constant(() => ({ "not str": validate.nonString })),
              fc.constant(() => validate.unless(validate.nonString))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const sParse = (value: string) => value.toUpperCase();
            expect(await validate(s, { ...validators, parse: sParse })).toBe(s.toUpperCase());

            const aParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(await validate(s, { ...validators, parse: aParse })).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const sParse = (value: number) => value * value;
          expectParse(await validate(n, { "not num": async () => await wait(() => !isNum(n)), parse: sParse }));
          expectParse(await validate(n, { "not int": async () => await wait(() => !isInt(n)), parse: sParse }));

          const aParse = async (value: number) => await wait(() => value * value);
          expectParse(await validate(n, { "not num": async () => await wait(() => !isNum(n)), parse: aParse }));
          expectParse(await validate(n, { "not int": async () => await wait(() => !isInt(n)), parse: aParse }));
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({ "not num": async () => await wait(() => !isNum(n)) })),
              fc.constant((n: number) => ({ "not int": async () => await wait(() => !isInt(n)) })),
              // Combine with various non-async validators:
              fc.constant((n: number) => ({ "not num": !isNum(n) })),
              fc.constant((n: number) => ({ "not num": () => !isNum(n) })),
              fc.constant((n: number) => ({ "not int": !isInt(n) })),
              fc.constant((n: number) => ({ "not int": () => !isInt(n) })),
              fc.constant(() => ({ "not num": validate.nonNumber })),
              fc.constant(() => validate.unless(validate.nonNumber))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const sParse = (value: number) => value * value;
            expect(await validate(n, { ...validators, parse: sParse })).toBe(n * n);

            const aParse = async (value: number) => await wait(() => value * value);
            expect(await validate(n, { ...validators, parse: aParse })).toBe(n * n);
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
});
