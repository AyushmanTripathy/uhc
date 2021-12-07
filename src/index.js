#!/usr/bin/env node

import { red } from "btss";
import { resolve } from "path";
import { readFileSync, writeFile, existsSync } from "fs";
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
      case "gc":
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
    exec(`sass ${css_output} ${build + "/bundle.css"} -I "${src}"`);

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

function readFile(path) {
  return readFileSync(path, "utf-8");
}

function parseIndex(path) {
  let file = readFile(path);
  let css = "";
  const styles = file.match(
    new RegExp("<style(.||\n)[^>]*>(.||\n)*</style( )*>", "g")
  );
  if (styles) {
    for (const style of styles) {
      file = file.replace(style, "");
      css += styles;
    }
  }

  let body = file.match(new RegExp("<body(.||\n)*</bodys*>", "g"))[0];
  if (!body) error("body not found in input file");
  file = file.match(new RegExp("<head(.||\n)*</heads*>", "g"))[0];
  if (!file) error("head not found in input file");
  [body, css] = parse(css + body, {}, 1);

  return [`<!DOCTYPE html><html lang="en">${file + body}</html>`, css];
}

function parse(input, vars, isIndex) {
  const class_name = "hcc" + hash();
  let file = isIndex ? input : readFile(input);

  //comments
  file = file.replaceAll(/\/\*(.||\n)*\*\//g, "");
  //file = file.replaceAll(/\/\/(.)*/g, "");

  let css = "";
  [file, css] = parseCss(file, class_name);
  file = addClassName(file, class_name);
  file = checkVars(file, vars);
  const temp = checkImports(file);
  temp[1] += css;
  return temp;
}

function addClassName(file, class_name) {
  const tags = file.match(new RegExp("<[^/](.||\n)[^>]*/*>", "g"));
  if (tags) {
    for (const tag of tags) {
      if (tag.includes("class="))
        file = file.replace(
          tag,
          tag.replace('class="', ` class="${class_name} `)
        );
      else {
        const temp = tag.endsWith("/>") ? "/>" : ">";
        file = file.replace(
          tag,
          tag.replace(temp, ` class="${class_name}"${temp}`)
        );
      }
    }
  }
  return file;
}

function parseCss(file, class_name) {
  let css = "";
  const styles = file.match(new RegExp("<style(.||\n)[^<]*</style( )*>", "g"));
  if (styles) {
    for (const style of styles) {
      file = file.replace(style, "");
      css += style;
    }
  }

  //add class selector to every property
  const selectors = css.match(/[a-z0-9]\s*{/gi);
  if (selectors) {
    for (const selector of selectors)
      css = css.replace(selector, `${selector[0]}.${class_name} {`);
  }
  return [file, css];
}

function checkVars(file, vars) {
  const statments = file.match(/\$[a-z]+/gi);
  if (statments) {
    for (const statment of statments) {
      if (!vars[statment.slice(1)]) error(statment + " is not defined");
      file = file.replace(statment, vars[statment.slice(1)]);
    }
  }
  return file;
}

function checkImports(file) {
  const imports = file.match(new RegExp("<import (.||\n)[^>]*/>", "gi"));
  let css = "";
  if (imports) {
    for (const imp of imports) {
      const attributes = imp.match(/[a-z]+="(\n||.)[^"]*"/gi);
      const vars = {};
      if (attributes) {
        for (let attribute of attributes) {
          attribute = attribute.slice(0, -1).split('="');
          vars[attribute[0]] = attribute[1];
        }
      }
      if (!vars.path) error("path not specified for import\n" + imp);
      const [html, styles] = parse(path(vars.path), vars);
      css += styles;
      file = file.replace(imp, html);
    }
  }
  return [file, css];
}

function path(path) {
  path = path.endsWith(".html") ? path : path + ".html";
  return resolve(src, path);
}

function hash() {
  globalThis.hash_no += 1;
  return globalThis.hash_no;
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

function execute(command, args = [], callback) {
  const child = spawn(command, args);
  child.on("exit", callback);
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
