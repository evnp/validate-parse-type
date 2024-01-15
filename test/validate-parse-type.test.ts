/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Some test cases require type errors to be ignored;
// these will employ @ts-ignore on a line-by-line basis
// and require typescript-eslint's aggressive restriction
// of these notations to be ignored ("ban-ts-comment").

import fc from "fast-check";

import { validate } from "../src/validate-parse-type";

const strValidators = [
  (s: string) => ({ "not str": typeof s !== "string" }),
  (s: string) => ({ "not str": () => typeof s !== "string" }),
  (s: string) => ({ "no len": !Number.isInteger(s.length) }),
  (s: string) => ({ "no len": () => !Number.isInteger(s.length) }),
  () => ({ "not str": validate.nonString }),
  () => validate.unless(validate.nonString),
];
const intValidators = [
  (n: number) => ({ "not num": typeof n !== "number" }),
  (n: number) => ({ "not num": () => typeof n !== "number" }),
  (n: number) => ({ "not int": !Number.isInteger(n) }),
  (n: number) => ({ "not int": () => !Number.isInteger(n) }),
  () => ({ "not num": validate.nonNumber }),
  () => validate.unless(validate.nonNumber),
];

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
      for (const { arbitrary, validators } of [
        { arbitrary: fc.string, validators: strValidators },
        { arbitrary: fc.integer, validators: intValidators },
      ]) {
        fc.assert(
          fc.property(arbitrary(), (d) => {
            for (const rule of validators) {
              expect(validate(d, rule(d as never))).toBe(d);
            }
          })
        );
        fc.assert(
          fc.property(
            arbitrary(),
            fc.array(fc.oneof(...validators.map((v: any) => fc.constant(v)))),
            fc.nat(5),
            (d, a, i) => {
              // This tests combinations of "singular rules" and "multiple rules"
              // "Singluar rules" are validations where a key maps to a single function or value.
              // "Multiple rules" are validations where a key maps to an array of functions or values.
              const singularRules = Object.assign({}, ...a.map((v) => v(d as never)));
              const multipleRules = Object.assign(
                {},
                ...a.map((v) => {
                  const [key, rule] = Object.entries(v(d as never))[0];
                  return { [key]: [rule, ...Object.values(singularRules).slice(i)] };
                })
              );
              expect(validate(d, singularRules)).toBe(d);
              expect(validate(d, multipleRules)).toBe(d);
              expect(validate(d, Object.assign({}, singularRules, multipleRules))).toBe(d);
              expect(validate(d, Object.assign({}, multipleRules, singularRules))).toBe(d);
            }
          )
        );
      }
    });

    test("validate -> parse", () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          const parse = (x: string) => x.toUpperCase();
          strValidators.forEach((v) =>
            expect(validate(s, { ...v(s), parse })).toBe(s.toUpperCase())
          );
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...strValidators.map((v) => fc.constant(v)))),
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
          intValidators.forEach((v) => expect(validate(n, { ...v(n), parse })).toBe(n * n));
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...intValidators.map((v) => fc.constant(v)))),
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
          strValidators.forEach((v) =>
            expect(validate(s, { parse, ...v(s) })).toBe(s.toUpperCase())
          );
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...strValidators.map((v) => fc.constant(v)))),
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
          intValidators.forEach((v) => expect(validate(n, { parse, ...v(n) })).toBe(n * n));
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...intValidators.map((v) => fc.constant(v)))),
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
          strValidators.forEach((v) =>
            expect(validate(s, midParseStr(parse, v(s)))).toBe(s.toUpperCase())
          );
        })
      );
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.oneof(...strValidators.map((v) => fc.constant(v)))),
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
          intValidators.forEach((v) => expect(validate(n, midParseNum(parse, v(n)))).toBe(n * n));
        })
      );
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.oneof(...intValidators.map((v) => fc.constant(v)))),
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
              ...strValidators.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));
            expect(await (validate(s, validators) as Promise<unknown>)).toBe(s);
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
              ...intValidators.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));
            expect(await (validate(n, validators) as Promise<unknown>)).toBe(n);
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
              ...strValidators.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const syncParse = (value: string) => value.toUpperCase();
            expect(
              await (validate(s, { ...validators, parse: syncParse }) as Promise<unknown>)
            ).toBe(s.toUpperCase());

            const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(
              await (validate(s, { ...validators, parse: asyncParse }) as Promise<unknown>)
            ).toBe(s.toUpperCase());
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
              ...intValidators.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const syncParse = (value: number) => value * value;
            expect(
              await (validate(n, { ...validators, parse: syncParse }) as Promise<unknown>)
            ).toBe(n * n);

            const asyncParse = async (value: number) => await wait(() => value * value);
            expect(
              await (validate(n, { ...validators, parse: asyncParse }) as Promise<unknown>)
            ).toBe(n * n);
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
              ...strValidators.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const syncParse = (value: string) => value.toUpperCase();
            expect(
              await (validate(s, { parse: syncParse, ...validators }) as Promise<unknown>)
            ).toBe(s.toUpperCase());

            const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(
              await (validate(s, { parse: asyncParse, ...validators }) as Promise<unknown>)
            ).toBe(s.toUpperCase());
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
              ...intValidators.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const syncParse = (value: number) => value * value;
            expect(
              await (validate(n, { parse: syncParse, ...validators }) as Promise<unknown>)
            ).toBe(n * n);

            const asyncParse = async (value: number) => await wait(() => value * value);
            expect(
              await (validate(n, { parse: asyncParse, ...validators }) as Promise<unknown>)
            ).toBe(n * n);
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
            await (validate(
              s,
              midParseStr(syncParse, {
                "not str": async () => await wait(() => typeof s !== "string"),
              })
            ) as unknown as Promise<string>)
          );
          expectParse(
            await (validate(
              s,
              midParseStr(syncParse, {
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })
            ) as unknown as Promise<string>)
          );

          const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
          expectParse(
            await (validate(
              s,
              midParseStr(asyncParse, {
                "not str": async () => await wait(() => typeof s !== "string"),
              })
            ) as unknown as Promise<string>)
          );
          expectParse(
            await (validate(
              s,
              midParseStr(asyncParse, {
                "no len": async () => await wait(() => !Number.isInteger(s.length)),
              })
            ) as unknown as Promise<string>)
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
              ...strValidators.map((v) => fc.constant(v))
            )
          ),
          async (s, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(s)));

            const syncParse = (value: string) => value.toUpperCase();
            expect(
              await (validate(s, midParseStr(syncParse, validators)) as unknown as Promise<unknown>)
            ).toBe(s.toUpperCase());

            const asyncParse = async (value: string) => await wait(() => value.toUpperCase());
            expect(
              await (validate(
                s,
                midParseStr(asyncParse, validators)
              ) as unknown as Promise<unknown>)
            ).toBe(s.toUpperCase());
          }
        )
      );
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (n) => {
          const expectParse = (value: number) => expect(value).toBe(n * n);

          const syncParse = (value: number) => value * value;
          expectParse(
            await (validate(
              n,
              midParseNum(syncParse, {
                "not num": async () => await wait(() => typeof n !== "number"),
              })
            ) as unknown as Promise<number>)
          );
          expectParse(
            await (validate(
              n,
              midParseNum(syncParse, {
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })
            ) as unknown as Promise<number>)
          );

          const asyncParse = async (value: number) => await wait(() => value * value);
          expectParse(
            await (validate(
              n,
              midParseNum(asyncParse, {
                "not num": async () => await wait(() => typeof n !== "number"),
              })
            ) as unknown as Promise<number>)
          );
          expectParse(
            await (validate(
              n,
              midParseNum(asyncParse, {
                "not int": async () => await wait(() => !Number.isInteger(n)),
              })
            ) as unknown as Promise<number>)
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
              ...intValidators.map((v) => fc.constant(v))
            )
          ),
          async (n, a) => {
            const validators = Object.assign({}, ...a.map((v) => v(n)));

            const syncParse = (value: number) => value * value;
            expect(
              await (validate(n, midParseNum(syncParse, validators)) as unknown as Promise<unknown>)
            ).toBe(n * n);

            const asyncParse = async (value: number) => await wait(() => value * value);
            expect(
              await (validate(
                n,
                midParseNum(asyncParse, validators)
              ) as unknown as Promise<unknown>)
            ).toBe(n * n);
          }
        )
      );
    });
  });
});
