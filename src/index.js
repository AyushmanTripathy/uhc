#!/usr/bin/env node

import { red } from "btss";
import { resolve } from "path";
import { readFileSync, writeFile, existsSync } from "fs";
import parseIndex from "./parser.js";
import cmd from "node-cmd";
import { promisify } from "util";

globalThis.hash_no = 0;
globalThis.log = (str) => console.log(str);
globalThis.error = (str) => {
  console.log(red("[ERROR] ") + str);
  process.exit(1);
};

const exec = promisify(cmd.run);

try {
  init();
} catch (e) {
  error(e.message);
}

function init() {
  const { words, options } = checkArgs(process.argv.splice(2));
  let config_path = "uhc.config.json";

  for (const option in options) {
    switch (option) {
      case "g":
        return generateConfig();
      case "c":
        config_path = options[option] == true ? config_path : options[option];
        break;
      case "h":
        return help();
    }
  }

  //get config
  config_path = "./" + config_path;
  if (!existsSync(config_path))
    error(
      config_path +
        " doesn't exists. use -gc to generate config file or use -c to link your config file"
    );

  globalThis.config = JSON.parse(readFileSync(config_path));

  if (!config.src_dir) error("src dir not specified!");
  if (!config.build_dir) error("build dir not specified!");

  globalThis.src = resolve(config_path, "../" + config.src_dir);
  globalThis.build = resolve(config_path, "../" + config.build_dir);
  compile();
}

async function compile() {
  let [html, css] = parseIndex(src + "/index.html");

  let css_output = build + "/bundle" + (config.css.scss ? ".scss" : ".css");
  if (config.css) {
    css = css.replaceAll(/<\/style.*>/g, "");
    css = css.replaceAll(/<style(.||\n)[^>]*>/g, "");
    if (config.css.prefix) css = config.css.prefix + css;
    write(css, css_output);
  } else error("css configs not found");

  //scss
  if (config.css.scss)
    exec(
      `sass ${css_output} ${build + "/bundle.css"} ${
        config.css.scss.source_map ? "" : "--no-source-map"
      } --load-path="${src}"`
    );

  //autoprefixer

  //html
  write(
    html.replace(
      /<\/head\s*>/,
      `<link rel="stylesheet" href="./bundle.css"/></head>`
    ),
    build + "/index.html"
  );
}

function write(content, path, isNotRelative) {
  path = isNotRelative ? "./" + path : path;
  writeFile(path, content, (e) => {
    if (e) error("couldn't write to " + path);
  });
}

function checkArgs(args) {
  const options = {};
  const words = [];

  let temp;
  for (const arg of args) {
    if (arg.startsWith("-")) {
      temp = arg.substring(1);
      options[temp] = true;
    } else if (temp) {
      options[temp] = arg;
      temp = null;
    } else {
      words.push(arg);
    }
  }

  return { options, words };
}
function generateConfig() {
  const data = readFileSync(
    new URL("../uhc.config.json.swp", import.meta.url),
    "utf-8"
  );
  write(data, "uhc.config.json");
}
function help() {
  log(readFileSync(new URL("../help.txt", import.meta.url), "utf-8"));
}
