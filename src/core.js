import { writeFile, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { grey } from "btss";
import parseIndex from "./parser.js";
import sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

export async function init() {
  try {
    await compile(config.routes);
    log(grey("compiled successfully!"));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
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
  write(html.replace("%head%", `<style>${css}</style>`), to);
}

export function loadConfig(config_path) {
  // get config
  config_path = "./" + config_path;
  if (!existsSync(config_path))
    error(config_path + " doesn't exists. use -h to know more.");

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
function write(content, path) {
  writeFile(path, content, (e) => {
    if (e) error("couldn't write to " + path);
  });
}
