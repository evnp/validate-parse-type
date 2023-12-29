const repl = require("repl").start();
const ctx = repl.context;
Object.assign(ctx, require("./validate-parse-type.js"));
