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

const validators = {
  string: [
    (s: string) => ({ "not str": !isStr(s) }),
    (s: string) => ({ "not str": () => !isStr(s) }),
    (s: string) => ({ "no len": !isInt(s.length) }),
    (s: string) => ({ "no len": () => !isInt(s.length) }),
    () => ({ "not str": validate.nonString }),
    () => validate.unless(validate.nonString),
  ],
  integer: [
    (n: number) => ({ "not num": !isNum(n) }),
    (n: number) => ({ "not num": () => !isNum(n) }),
    (n: number) => ({ "not int": !isInt(n) }),
    (n: number) => ({ "not int": () => !isNum(n) }),
    () => ({ "not num": validate.nonNumber }),
    () => validate.unless(validate.nonNumber),
  ],
};

function suffixObjectKeys(obj: object, suffix: string) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k + suffix, v]));
}
function midParseStr(parse: (value: string) => string, validators: Record<string, unknown>) {
  return {
    ...suffixObjectKeys(validators, " (pre-parse)"),
    parse,
    ...suffixObjectKeys(validators, " (post-parse)"),
  };
}
function midParseNum(parse: (value: number) => number, validators: Record<string, unknown>) {
  return {
    ...suffixObjectKeys(validators, " (pre-parse)"),
    parse,
    ...suffixObjectKeys(validators, " (post-parse)"),
  };
}

describe("validate-parse-type", () => {
  describe("synchronous", () => {
    test("validate", () => {
      fc.assert(
        fc.property(fc.string(), (s) =>
          validators.string.forEach((v) => expect(validate(s, v(s))).toBe(s))
        )
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...validators.string.map((v) => fc.constant(v)))),
          (s, a) => expect(validate(s, Object.assign({}, ...a.map((v) => v(s))))).toBe(s)
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) =>
          validators.integer.forEach((v) => expect(validate(n, v(n))).toBe(n))
        )
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...validators.integer.map((v) => fc.constant(v)))),
          (n, a) => expect(validate(n, Object.assign({}, ...a.map((v) => v(n))))).toBe(n)
        )
      );
    });

    test("validate -> parse", () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (x: string) => x.toUpperCase();
          validators.string.forEach((v) =>
            expect(validate(s, { ...v(s), parse })).toBe(s.toUpperCase())
          );
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...validators.string.map((v) => fc.constant(v)))),
          (s, a) => {
            const parse = (x: string) => x.toUpperCase();
            const rules = Object.assign({}, ...a.map((v) => v(s)));
            expect(validate(s, { ...rules, parse })).toBe(s.toUpperCase());
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const parse = (x: number) => x * x;
          validators.integer.forEach((v) => expect(validate(n, { ...v(n), parse })).toBe(n * n));
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...validators.integer.map((v) => fc.constant(v)))),
          (n, a) => {
            const parse = (x: number) => x * x;
            const rules = Object.assign({}, ...a.map((v) => v(n)));
            expect(validate(n, { ...rules, parse })).toBe(n * n);
          }
        )
      );
    });

    test("parse -> validate", () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (x: string) => x.toUpperCase();
          validators.string.forEach((v) =>
            expect(validate(s, { parse, ...v(s) })).toBe(s.toUpperCase())
          );
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...validators.string.map((v) => fc.constant(v)))),
          (s, a) => {
            const parse = (x: string) => x.toUpperCase();
            const rules = Object.assign({}, ...a.map((v) => v(s)));
            expect(validate(s, { parse, ...rules })).toBe(s.toUpperCase());
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const parse = (x: number) => x * x;
          validators.integer.forEach((v) => expect(validate(n, { parse, ...v(n) })).toBe(n * n));
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...validators.integer.map((v) => fc.constant(v)))),
          (n, a) => {
            const parse = (x: number) => x * x;
            const rules = Object.assign({}, ...a.map((v) => v(n)));
            expect(validate(n, { parse, ...rules })).toBe(n * n);
          }
        )
      );
    });

    test("validate -> parse -> validate", () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (x: string) => x.toUpperCase();
          validators.string.forEach((v) =>
            expect(validate(s, midParseStr(parse, v(s)))).toBe(s.toUpperCase())
          );
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...validators.string.map((v) => fc.constant(v)))),
          (s, a) => {
            const parse = (x: string) => x.toUpperCase();
            const rules = Object.assign({}, ...a.map((v) => v(s)));
            expect(validate(s, midParseStr(parse, rules))).toBe(s.toUpperCase());
          }
        )
      );
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const parse = (x: number) => x * x;
          validators.integer.forEach((v) =>
            expect(validate(n, midParseNum(parse, v(n)))).toBe(n * n)
          );
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...validators.integer.map((v) => fc.constant(v)))),
          (n, a) => {
            const parse = (x: number) => x * x;
            const rules = Object.assign({}, ...a.map((v) => v(n)));
            expect(validate(n, midParseNum(parse, rules))).toBe(n * n);
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
          expect(
            await validate(s, { "no len": async () => await wait(() => !isInt(s.length)) })
          ).toBe(s);
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": async () => await wait(() => !isStr(s)) })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !isInt(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
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
              ...validators.integer.map((v) => fc.constant(v))
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
          expectParse(
            await validate(s, { "not str": async () => await wait(() => !isStr(s)), parse: sParse })
          );
          expectParse(
            await validate(s, {
              "no len": async () => await wait(() => !isInt(s.length)),
              parse: sParse,
            })
          );

          const aParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await validate(s, { "not str": async () => await wait(() => !isStr(s)), parse: aParse })
          );
          expectParse(
            await validate(s, {
              "no len": async () => await wait(() => !isInt(s.length)),
              parse: aParse,
            })
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": async () => await wait(() => !isStr(s)) })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !isInt(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
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
          expectParse(
            await validate(n, { "not num": async () => await wait(() => !isNum(n)), parse: sParse })
          );
          expectParse(
            await validate(n, { "not int": async () => await wait(() => !isInt(n)), parse: sParse })
          );

          const aParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await validate(n, { "not num": async () => await wait(() => !isNum(n)), parse: aParse })
          );
          expectParse(
            await validate(n, { "not int": async () => await wait(() => !isInt(n)), parse: aParse })
          );
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
              ...validators.integer.map((v) => fc.constant(v))
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

    test("parse -> validate", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());

          const sParse = (value: string) => value.toUpperCase();
          expectParse(
            await validate(s, { parse: sParse, "not str": async () => await wait(() => !isStr(s)) })
          );
          expectParse(
            await validate(s, {
              parse: sParse,
              "no len": async () => await wait(() => !isInt(s.length)),
            })
          );

          const aParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await validate(s, { parse: aParse, "not str": async () => await wait(() => !isStr(s)) })
          );
          expectParse(
            await validate(s, {
              parse: aParse,
              "no len": async () => await wait(() => !isInt(s.length)),
            })
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": async () => await wait(() => !isStr(s)) })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !isInt(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const sParse = (value: string) => value.toUpperCase();
            expect(await validate(s, { parse: sParse, ...validators })).toBe(s.toUpperCase());

            const aParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(await validate(s, { parse: aParse, ...validators })).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const sParse = (value: number) => value * value;
          expectParse(
            await validate(n, { parse: sParse, "not num": async () => await wait(() => !isNum(n)) })
          );
          expectParse(
            await validate(n, { parse: sParse, "not int": async () => await wait(() => !isInt(n)) })
          );

          const aParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await validate(n, { parse: aParse, "not num": async () => await wait(() => !isNum(n)) })
          );
          expectParse(
            await validate(n, { parse: aParse, "not int": async () => await wait(() => !isInt(n)) })
          );
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
              ...validators.integer.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const sParse = (value: number) => value * value;
            expect(await validate(n, { parse: sParse, ...validators })).toBe(n * n);

            const aParse = async (value: number) => await wait(() => value * value);
            expect(await validate(n, { parse: aParse, ...validators })).toBe(n * n);
          }
        )
      );
    });

    test("validate -> parse -> validate", async () => {
      function suffix(obj: object, suf: string) {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k + suf, v]));
      }
      function midParseStr(
        parse: (value: string) => string | Promise<string>,
        validators: Record<string, unknown>
      ) {
        return {
          ...suffix(validators, " (pre-parse)"),
          parse,
          ...suffix(validators, " (post-parse)"),
        };
      }
      function midParseNum(
        parse: (value: number) => number | Promise<number>,
        validators: Record<string, unknown>
      ) {
        return {
          ...suffix(validators, " (pre-parse)"),
          parse,
          ...suffix(validators, " (post-parse)"),
        };
      }
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());

          const sParse = (value: string) => value.toUpperCase();
          expectParse(
            await validate(
              s,
              midParseStr(sParse, { "not str": async () => await wait(() => !isStr(s)) })
            )
          );
          expectParse(
            await validate(
              s,
              midParseStr(sParse, { "no len": async () => await wait(() => !isInt(s.length)) })
            )
          );

          const aParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await validate(
              s,
              midParseStr(aParse, { "not str": async () => await wait(() => !isStr(s)) })
            )
          );
          expectParse(
            await validate(
              s,
              midParseStr(aParse, { "no len": async () => await wait(() => !isInt(s.length)) })
            )
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({ "not str": async () => await wait(() => !isStr(s)) })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !isInt(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const sParse = (value: string) => value.toUpperCase();
            expect(await validate(s, midParseStr(sParse, validators))).toBe(s.toUpperCase());

            const aParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(await validate(s, midParseStr(aParse, validators))).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const sParse = (value: number) => value * value;
          expectParse(
            await validate(
              n,
              midParseNum(sParse, { "not num": async () => await wait(() => !isNum(n)) })
            )
          );
          expectParse(
            await validate(
              n,
              midParseNum(sParse, { "not int": async () => await wait(() => !isInt(n)) })
            )
          );

          const aParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await validate(
              n,
              midParseNum(aParse, { "not num": async () => await wait(() => !isNum(n)) })
            )
          );
          expectParse(
            await validate(
              n,
              midParseNum(aParse, { "not int": async () => await wait(() => !isInt(n)) })
            )
          );
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
              ...validators.integer.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const sParse = (value: number) => value * value;
            expect(await validate(n, midParseNum(sParse, validators))).toBe(n * n);

            const aParse = async (value: number) => await wait(() => value * value);
            expect(await validate(n, midParseNum(aParse, validators))).toBe(n * n);
          }
        )
      );
    });
  });
});
