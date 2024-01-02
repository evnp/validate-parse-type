const repl = require("repl").start();
const ctx = repl.context;
Object.assign(ctx, require("../dist/validate-parse-type.min.js"));
