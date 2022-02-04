import { watch } from "chokidar";
import { createInterface } from "readline";
import { resolve, basename } from "path";
import { readFileSync } from "fs";
import { green ,grey } from "btss";
import { createServer } from "http";
import * as core from "./core.js";

export default function (config_path) {
  core.loadConfig(config_path);
  compileOnChange(src);

  const port = 8080;
  const server = createServer((req,res) =>{
    res.end("<p>hello world</p>");
  })
  server.listen(port,()=> console.log("listening on "+port))

  watchDir(build, (event, path) => {
    log(grey("reloading..."))
  },500);
}

export async function compileOnChange(path, load_config, config_path) {
  log(green('"r" to recompile or "q" to quit'));
  if (load_config) core.loadConfig(config_path);

  createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  }).on("line", (data) => {
    if (data == "r") core.default(true);
    else if (data == "q") process.exit();
  });

  await watchDir(path, (event, path) => {
    globalThis.template = readFileSync(resolve(src, config.template), "utf-8");
    log(green(event + " : " + basename(path)));
    core.default(true);
  });
}

async function watchDir(path, callback, wait = 400) {
  let react = false;
  watch(path)
    .on("all", (event, path) => {
      if (!react) return;
      callback(event, path);
      react = false;
      setTimeout(() => (react = true), wait);
    })
    .on("ready", () => (react = true));
}
