#!/usr/bin/env node

import { bold, red, green, yellow } from "btss";
import { createInterface } from "readline";
import { exec } from "child_process";
import { resolve, basename } from "path";
import { rm, existsSync, writeFile, readFileSync } from "fs";

import dotenv from "dotenv";

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

globalThis.version = loadJson("../package.json").version;

init();
async function init() {
  try {
    log(bold("UHC " + version));

    let config_path = "uhc.config.json";
    const { words, options } = parseArgs(process.argv.splice(2));
    dotenv.config();

    // watch function test
    const temp = await checkArgs(options, config_path);
    if (!temp) return;
    else if (temp != 1) config_path = temp;

    if (!words.length) {
      const { init: compile, loadConfig } = await import("./core.js");
      loadConfig(config_path);
      await compile();
    } else await checkCommands(words, config_path);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function checkArgs(options, config_path) {
  for (const option in options) {
    switch (option) {
      case "g":
        return generateConfig();
      case "c":
        config_path = options[option] == true ? config_path : options[option];
        return config_path;
      case "w":
        const { init: compile, loadConfig } = await import("./core.js");
        if (options[option] == true) error("watch path required");
        loadConfig(config_path);
        return await watchDir(options[option], compile);
      case "h":
        return help();
      default:
        return error("unknown option " + option);
    }
  }
  return 1;
}

async function checkCommands(words, config_path) {
  switch (words[0]) {
    case "dev":
      const { init: compile, loadConfig } = await import("./core.js");
      loadConfig(config_path);
      const port = process.env.PORT || 8080;
      const { default: liveServer } = await import("live-server");
      liveServer.start({
        port: port,
        root: build,
        file: ".",
        open: false,
        logLevel: 2,
      });
      return await watchDir(src, compile);
    case "init":
      const name = words[1] || "uhc-app";
      return exec(
        "git clone https://github.com/AyushmanTripathy/uhc-template " + name,
        (err, stdout, stderr) => {
          if (err) return log(err.message);
          rm(name + "/.git", { recursive: true }, (err) => {
            if (err) {
              warn("error while removing .git");
              log(err.message);
            }
          });
          if (stdout) log(stdout);
          if (stderr) log(stderr);
        }
      );
    default:
      error("unknown command " + words[0]);
  }
}

async function watchDir(path, compile) {
  if (!existsSync(path)) error(path + " path doesn't exits");
  log(green('"r" to recompile or "q" to quit'));

  createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  }).on("line", (data) => {
    if (data == "r") compile();
    else if (data == "q") process.exit();
  });

  let compile_on_change = false;
  setTimeout(() => {
    compile_on_change = true;
  }, 500);

  const { watch } = await import("chokidar");
  watch(path).on("all", (event, path) => {
    if (!compile_on_change) return;
    globalThis.template = readFileSync(resolve(src, config.template), "utf-8");
    log(green(event + " : " + basename(path)));
    compile();
  });
}

function loadJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url)));
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

  writeFile("./uhc.config.json", data, (e) => {
    if (e) error("couldn't write to " + path);
    else log(green("uhc.config.json generated"));
  });
}

function help() {
  log(readFileSync(new URL("../help.txt", import.meta.url), "utf-8"));
}
