#!/usr/bin/env node

import { bold, grey, red, green, yellow } from "btss";
import { resolve } from "path";
import { createInterface } from "readline";
import { basename } from "path";
import { readFileSync, writeFile, watch, mkdirSync, existsSync } from "fs";
import parseIndex from "./parser.js";

import sass from "sass";
import postcss from "postcss";
import dotenv from "dotenv";
import chokidar from "chokidar";
import liveServer from "live-server";
import autoprefixer from "autoprefixer";

globalThis.hash_no = 0;
globalThis.log = (str) => console.log(str);
globalThis.warn = (str) => log(yellow("[WARN] ") + str);
globalThis.hash = () => {
  hash_no += 1;
  return hash_no;
};
globalThis.error = (str) => {
  throw red("[ERROR] ") + str;
};

const version = loadJson("../package.json").version;

try {
  log(bold("UHC " + version));
  dotenv.config();
  await checkArgs();
} catch (e) {
  console.error(e);
}

async function checkArgs() {
  let config_path = "uhc.config.json";
  const { words, options } = parseArgs(process.argv.splice(2));

  for (const option in options) {
    switch (option) {
      case "g":
        return generateConfig();
      case "c":
        config_path = options[option] == true ? config_path : options[option];
        break;
      case "w":
        if (options[option] == true) error("watch path required");
        loadConfig(config_path);
        return await watchDir(options[option]);
      case "h":
        return help();
    }
  }

  loadConfig(config_path);
  for (const word of words) {
    switch (word) {
      case "dev":
        const port = process.env.PORT || 8080;
        liveServer.start({
          port: port,
          root: build,
          file: ".",
          open: false,
          logLevel: 2,
        });
        return await watchDir(src);
    }
  }
  init();
}

function loadConfig(config_path) {
  // get config
  config_path = "./" + config_path;
  if (!existsSync(config_path))
    error(config_path + " doesn't exists. use -g to generate a config file.");

  globalThis.config = JSON.parse(readFileSync(config_path));
  checkVersion(config.uhc);

  if (!config.src_dir) error("src dir not specified!");
  if (!config.build_dir) error("build dir not specified!");
  globalThis.src = resolve(config_path, "../" + config.src_dir);
  globalThis.build = resolve(config_path, "../" + config.build_dir);

  if (config.template)
    globalThis.template = readFileSync(resolve(src, config.template), "utf-8");
  if (!config.routes) error("routes not specified");
  if (!Object.keys(config.routes).length) error("at least one route required");

  if (config.load) {
    if (!config.vars) config.vars = {};
    for (const key of config.load) {
      if (!process.env[key]) warn("env var " + key + " is not defined");
      config.vars[key] = process.env[key];
    }
  }
}

async function init() {
  try {
    await compile(config.routes);
    log(grey("compiled successfully!"));
  } catch (e) {
    console.error(e);
  }
}

async function watchDir(path) {
  if (!existsSync(path)) error(path + " path doesn't exits");
  log(green('"r" to recompile or "q" to quit'));

  createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  }).on("line", (data) => {
    if (data == "r") init(true);
    else if (data == "q") process.exit();
  });

  let compile_on_change = false;
  setTimeout(() => {
    compile_on_change = true;
  }, 500);

  chokidar.watch(path).on("all", (event, path) => {
    if (!compile_on_change) return;
    log(green(event + " : " + basename(path)));
    init();
  });
}

async function compile(routes, dir_path = "") {
  for (let route in routes) {
    switch (typeof routes[route]) {
      case "string":
        const input_file = routes[route];
        if (route.startsWith("/")) route = route.slice(1);
        if (!route) route = "index.html";
        if (!route.endsWith(".html")) route += ".html";

        const from = resolve(src, input_file);
        const to = resolve(build, dir_path + route);

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
  const from_dir = resolve(from, "../");
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
    try {
      css = sass.compileString(css, {
        loadPaths: [from_dir],
      }).css;
    } catch (e) {
      return console.error(e.message);
    }
  }

  const plugins = [];
  if (config.css.autoprefix) plugins.push(autoprefixer);

  // postcss
  if (plugins.length) {
    try {
      const res = await postcss(plugins).process(css, { from: id.slice(1) });
      if (res.map) write(res.map, to_dir + id + ".map");
      css = res.css;
    } catch (e) {
      return console.error(e);
    }
  }

  //html
  write(html.replace(/<\/head\s*>/, `<style>` + css + `</style></head>`), to);
}

function loadJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url)));
}

function write(content, path, isNotRelative) {
  path = isNotRelative ? "./" + path : path;
  writeFile(path, content, (e) => {
    if (e) error("couldn't write to " + path);
  });
}

function parseArgs(args) {
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
  ).replace("<uhc_version>", version);
  write(data, "uhc.config.json");
  log(green("uhc.config.json generated"));
}
function help() {
  log(readFileSync(new URL("../help.txt", import.meta.url), "utf-8"));
}
function checkVersion(ver) {
  if (!ver)
    return warn(
      "using a much lower config version than recommended, update to 1.5 or heigher"
    );
  if (ver == version) return;

  ver = ver.split(".").slice(0, 2).map(Number);
  const config_version = version.split(".").slice(0, 2).map(Number);

  for (let i = 0; i < 2; i++) {
    if (ver[i] < config_version[i])
      return warn("using a higher version than mentioned in config");
    else if (ver[i] > config_version[i])
      return warn("using a lower version than mentioned in config");
  }
}
