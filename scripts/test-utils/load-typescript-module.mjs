import fs from "node:fs";
import ts from "typescript";

export function loadTypeScriptModule(file) {
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function("module", "exports", output)(loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
