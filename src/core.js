import { writeFile, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { grey } from "btss";
import parseIndex from "./parser.js";
import sass from "sass";
import { minify } from "html-minifier";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

export default async function (watching) {
  try {
    await compile(config.routes);
    log(grey("compiled successfully!"));
  } catch (e) {
    if (typeof e == "object") e = e.message;
    if (!watching) throw e;
    console.error(e);
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

  css = css.replaceAll(/<\/style( )*>/g, "");
  css = css.replaceAll(/<style(.||\n)[^<]*>/g, "");

  if (typeof config.css == "object") {
    if (config.css.prefix) css = config.css.prefix + css;
  } else {
    warn("no config provided for css.");
    config.css = {};
  }

  // sass
  if (config.css.sass) {
    try {
      let options = {
        loadPaths: [from_dir],
      };
      if (typeof config.css.sass == "object")
        options = { ...options, ...config.css.sass };
      css = sass.compileString(css, options);
      if (css.sourceMap) {
        const mapPath = to.replace(".html", ".css.map");
        write(JSON.stringify(css.sourceMap), mapPath);
        log(
          grey("source map generated ") +
            mapPath.match(/\/(.)[^\/]*\.css\.map/)[0].slice(1)
        );
      }
      css = css.css;
    } catch (e) {
      return error("sass error\n" + e.message);
    }
  }

  const plugins = [];
  if (config.css.autoprefix) plugins.push(autoprefixer);

  // postcss
  if (plugins.length) {
    try {
      css = await postcss(plugins).process(css, { from: undefined }).css;
    } catch (e) {
      error("postcss error\n" + e.message);
    }
  }
  html = html.replace("%head%", `<style>${css}</style>`);

  // minify
  if (config.minify) {
    const minifyOptions = {
      collapseWhitespace: true,
      removeComments: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeEmptyAttributes: true,
      removeTagWhitespace: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifJS: true,
    };
    if (typeof config.minify == "object")
      for (const key in config.minify) minifyOptions[key] = config.minify[key];
    try {
      html = minify(html, minifyOptions);
    } catch (e) {
      error(e.message);
    }
  }
  write(html, to);
}

export function loadConfig(config_path) {
  // get config
  config_path = "./" + config_path;
  if (!existsSync(config_path))
    error(config_path + " doesn't exists. use -h to know more.");

  try {
    globalThis.config = JSON.parse(readFileSync(config_path));
  } catch (e) {
    error(`error while parsing ${config_path}\n${e.message}`);
  }
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
