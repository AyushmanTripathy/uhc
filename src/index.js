#!/usr/bin/env node

import { bold, red, green, yellow } from "btss";
import { exec } from "child_process";
import { rm, writeFile, readFileSync } from "fs";

import dotenv from "dotenv";

globalThis.hash_no = 0;
globalThis.log = (str) => console.log(str);
globalThis.warn = (str) => log(yellow("[WARN] ") + str);
globalThis.hash = () => {
  hash_no += 1;
  return hash_no;
};

globalThis.error = (str, source) => {
  let msg = red("[ERROR] ") + str;
  if (source) {
    source =
      yellow("\n-------\nsource\n ") +
      source.reverse().splice(0, 5).join("\n imported from ");
    msg += source;
  }
  throw msg;
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
      const { default: compile, loadConfig } = await import("./core.js");
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
        const { compileOnChange } = await import("./dev.js");
        return compileOnChange(options[option], true, config_path);
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
      const { default: dev } = await import("./dev.js");
      return await dev(config_path);
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
