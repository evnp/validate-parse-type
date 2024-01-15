/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Some test cases require type errors to be ignored;
// these will employ @ts-ignore on a line-by-line basis
// and require typescript-eslint's aggressive restriction
// of these notations to be ignored ("ban-ts-comment").

import fc from "fast-check";

import { validate } from "../src/validate-parse-type";

const validators = {
  string: [
    (s: string) => ({ "not str": typeof s !== "string" }),
    (s: string) => ({ "not str": () => typeof s !== "string" }),
    (s: string) => ({ "no len": !Number.isInteger(s.length) }),
    (s: string) => ({ "no len": () => !Number.isInteger(s.length) }),
    () => ({ "not str": validate.nonString }),
    () => validate.unless(validate.nonString),
  ],
  integer: [
    (n: number) => ({ "not num": typeof n !== "number" }),
    (n: number) => ({ "not num": () => typeof n !== "number" }),
    (n: number) => ({ "not int": !Number.isInteger(n) }),
    (n: number) => ({ "not int": () => !Number.isInteger(n) }),
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
          expect(
            await validate(s, { "not str": async () => await wait(() => typeof s !== "string") })
          ).toBe(s);
          expect(
            await validate(s, {
              "no len": async () => await wait(() => !Number.isInteger(s.length)),
            })
          ).toBe(s);
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({
                "not str": async () => await wait(() => typeof s !== "string"),
              })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
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
          expect(
            await validate(n, { "not num": async () => await wait(() => typeof n !== "number") })
          ).toBe(n);
          expect(
            await validate(n, { "not int": async () => await wait(() => !Number.isInteger(n)) })
          ).toBe(n);
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({
                "not num": async () => await wait(() => typeof n !== "number"),
              })),
              fc.constant((n: number) => ({
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })),
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

          const syncParse = (value: string) => value.toUpperCase();
          expectParse(
            await validate(s, {
              "not str": async () => await wait(() => typeof s !== "string"),
              parse: syncParse,
            })
          );
          expectParse(
            await validate(s, {
              "no len": async () => await wait(() => !Number.isInteger(s.length)),
              parse: syncParse,
            })
          );

          const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await validate(s, {
              "not str": async () => await wait(() => typeof s !== "string"),
              parse: asyncParse,
            })
          );
          expectParse(
            await validate(s, {
              "no len": async () => await wait(() => !Number.isInteger(s.length)),
              parse: asyncParse,
            })
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({
                "not str": async () => await wait(() => typeof s !== "string"),
              })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const syncParse = (value: string) => value.toUpperCase();
            expect(await validate(s, { ...validators, parse: syncParse })).toBe(s.toUpperCase());

            const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(await validate(s, { ...validators, parse: asyncParse })).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const syncParse = (value: number) => value * value;
          expectParse(
            await validate(n, {
              "not num": async () => await wait(() => typeof n !== "number"),
              parse: syncParse,
            })
          );
          expectParse(
            await validate(n, {
              "not int": async () => await wait(() => !Number.isInteger(n)),
              parse: syncParse,
            })
          );

          const asyncParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await validate(n, {
              "not num": async () => await wait(() => typeof n !== "number"),
              parse: asyncParse,
            })
          );
          expectParse(
            await validate(n, {
              "not int": async () => await wait(() => !Number.isInteger(n)),
              parse: asyncParse,
            })
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({
                "not num": async () => await wait(() => typeof n !== "number"),
              })),
              fc.constant((n: number) => ({
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })),
              // Combine with various non-async validators:
              ...validators.integer.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const syncParse = (value: number) => value * value;
            expect(await validate(n, { ...validators, parse: syncParse })).toBe(n * n);

            const asyncParse = async (value: number) => await wait(() => value * value);
            expect(await validate(n, { ...validators, parse: asyncParse })).toBe(n * n);
          }
        )
      );
    });

    test("parse -> validate", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (s) => {
          const expectParse = (value: string) => expect(value).toBe(s.toUpperCase());

          const syncParse = (value: string) => value.toUpperCase();
          expectParse(
            await validate(s, {
              parse: syncParse,
              "not str": async () => await wait(() => typeof s !== "string"),
            })
          );
          expectParse(
            await validate(s, {
              parse: syncParse,
              "no len": async () => await wait(() => !Number.isInteger(s.length)),
            })
          );

          const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await validate(s, {
              parse: asyncParse,
              "not str": async () => await wait(() => typeof s !== "string"),
            })
          );
          expectParse(
            await validate(s, {
              parse: asyncParse,
              "no len": async () => await wait(() => !Number.isInteger(s.length)),
            })
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({
                "not str": async () => await wait(() => typeof s !== "string"),
              })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const syncParse = (value: string) => value.toUpperCase();
            expect(await validate(s, { parse: syncParse, ...validators })).toBe(s.toUpperCase());

            const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(await validate(s, { parse: asyncParse, ...validators })).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const syncParse = (value: number) => value * value;
          expectParse(
            await validate(n, {
              parse: syncParse,
              "not num": async () => await wait(() => typeof n !== "number"),
            })
          );
          expectParse(
            await validate(n, {
              parse: syncParse,
              "not int": async () => await wait(() => !Number.isInteger(n)),
            })
          );

          const asyncParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await validate(n, {
              parse: asyncParse,
              "not num": async () => await wait(() => typeof n !== "number"),
            })
          );
          expectParse(
            await validate(n, {
              parse: asyncParse,
              "not int": async () => await wait(() => !Number.isInteger(n)),
            })
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({
                "not num": async () => await wait(() => typeof n !== "number"),
              })),
              fc.constant((n: number) => ({
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })),
              // Combine with various non-async validators:
              ...validators.integer.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const syncParse = (value: number) => value * value;
            expect(await validate(n, { parse: syncParse, ...validators })).toBe(n * n);

            const asyncParse = async (value: number) => await wait(() => value * value);
            expect(await validate(n, { parse: asyncParse, ...validators })).toBe(n * n);
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

          const syncParse = (value: string) => value.toUpperCase();
          expectParse(
            await validate(
              s,
              midParseStr(syncParse, {
                "not str": async () => await wait(() => typeof s !== "string"),
              })
            )
          );
          expectParse(
            await validate(
              s,
              midParseStr(syncParse, {
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })
            )
          );

          const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await validate(
              s,
              midParseStr(asyncParse, {
                "not str": async () => await wait(() => typeof s !== "string"),
              })
            )
          );
          expectParse(
            await validate(
              s,
              midParseStr(asyncParse, {
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })
            )
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.oneof(
              fc.constant((s: string) => ({
                "not str": async () => await wait(() => typeof s !== "string"),
              })),
              fc.constant((s: string) => ({
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })),
              // Combine with various non-async validators:
              ...validators.string.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const syncParse = (value: string) => value.toUpperCase();
            expect(await validate(s, midParseStr(syncParse, validators))).toBe(s.toUpperCase());

            const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(await validate(s, midParseStr(asyncParse, validators))).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const syncParse = (value: number) => value * value;
          expectParse(
            await validate(
              n,
              midParseNum(syncParse, {
                "not num": async () => await wait(() => typeof n !== "number"),
              })
            )
          );
          expectParse(
            await validate(
              n,
              midParseNum(syncParse, {
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })
            )
          );

          const asyncParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await validate(
              n,
              midParseNum(asyncParse, {
                "not num": async () => await wait(() => typeof n !== "number"),
              })
            )
          );
          expectParse(
            await validate(
              n,
              midParseNum(asyncParse, {
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })
            )
          );
        })
      );
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.array(
            fc.oneof(
              fc.constant((n: number) => ({
                "not num": async () => await wait(() => typeof n !== "number"),
              })),
              fc.constant((n: number) => ({
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })),
              // Combine with various non-async validators:
              ...validators.integer.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const syncParse = (value: number) => value * value;
            expect(await validate(n, midParseNum(syncParse, validators))).toBe(n * n);

            const asyncParse = async (value: number) => await wait(() => value * value);
            expect(await validate(n, midParseNum(asyncParse, validators))).toBe(n * n);
          }
        )
      );
    });
  });
});
