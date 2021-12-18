#!/usr/bin/env node

import { red, green } from "btss";
import { resolve } from "path";
import { readFileSync, writeFile, watch, mkdirSync, existsSync } from "fs";
import parseIndex from "./parser.js";

import sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

globalThis.hash_no = 0;
globalThis.log = (str) => console.log(str);
globalThis.hash = () => {
  hash_no += 1;
  return hash_no;
};
globalThis.error = (str) => {
  console.log(red("[ERROR] ") + str);
  console.log("terminating compilation...");
  process.exit(1);
};

try {
  init();
} catch (e) {
  error(e.message);
}

function watchDir(path) {
  globalThis.watch_delay = false;

  watch(path, () => {
    if (!watch_delay) {
      log(green("Change dectected..."));

      init(true);
      globalThis.watch_delay = true;
      setTimeout(() => {
        globalThis.watch_delay = false;
      }, 50);
    }
  });
}

async function init(watch) {
  let config_path = "uhc.config.json";

  if (!watch) {
    const { words, options } = checkArgs(process.argv.splice(2));
    for (const option in options) {
      switch (option) {
        case "g":
          return generateConfig();
        case "c":
          config_path =
            options[option] == true ? config_path : options[option];
          break;
        case "w":
          if (options[option] == true) error("watch path required");
          return watchDir(options[option]);
        case "h":
          return help();
      }
    }
  }

  //get config
  config_path = "./" + config_path;
  if (!existsSync(config_path))
    error(
      config_path +
        " doesn't exists. use -g to generate config file or use -c to link your config file"
    );

  globalThis.config = JSON.parse(readFileSync(config_path));

  if (!config.src_dir) error("src dir not specified!");
  if (!config.build_dir) error("build dir not specified!");
  globalThis.src = resolve(config_path, "../" + config.src_dir);
  globalThis.build = resolve(config_path, "../" + config.build_dir);

  if (config.template)
    globalThis.template = readFileSync(resolve(src, config.template), "utf-8");
  if (!config.routes) error("routes not specified");
  if (!Object.keys(config.routes).length) error("at least one route required");
  compile(config.routes);
}

async function compile(routes, dir_path = "") {
  for (let route in routes) {
    switch (typeof routes[route]) {
      case "string":
        const input_file = routes[route];
        if (route.startsWith("/")) route = route.slice(1);
        if (!route) route = "index.html";
        if (!route.endsWith(".html")) route += ".html";

        const from = resolve(config.src_dir, input_file);
        const to = resolve(config.build_dir, dir_path + route);
        globalThis.from_dir = resolve(from, "../");

        await compileRoute(from, to);
        break;
      case "object":
        // check for dir
        const dir = resolve(config.build_dir, dir_path + route + "/");
        if (!existsSync(dir)) mkdirSync(dir);
        await compile(routes[route], dir_path + route + "/");
        break;
    }
  }
}

async function compileRoute(from, to) {
  let [html, css] = parseIndex(from);

  if (config.css) {
    css = css.replaceAll(/<\/style( )*>/g, "");
    css = css.replaceAll(/<style(.||\n)[^<]*>/g, "");
    if (config.css.prefix) css = config.css.prefix + css;
  } else error("css configs not found");

  const id = "/bundle" + hash() + ".css";
  const to_dir = resolve(to, "../");

  // sass
  if (config.css.sass) {
    css = sass.compileString(css, {
      loadPaths: [from_dir],
    }).css;
  }

  const plugins = [];
  if (config.css.autoprefix) plugins.push(autoprefixer);

  // postcss
  if (plugins.length) {
    const res = await postcss(plugins).process(css, { from: id.slice(1) });
    if (res.map) write(res.map, to_dir + id + ".map");
    css = res.css;
  }

  //html
  write(html.replace(/<\/head\s*>/, `<style>` + css + `</style></head>`), to);
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
