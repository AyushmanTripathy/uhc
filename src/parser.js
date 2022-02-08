import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { runInContext, createContext } from "vm";

export default function parseIndex(path) {
  let file = readFileSync(path, "utf-8");
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
  if (!config.template) {
    error("templates are no longer optional in 1.6.0 and higher.");
  } else {
    checkTemplate(template, config.template);
    const temp = parse(path, config.vars, [], css + file);
    file = temp[0];
    css = temp[1];
    file = template.replace("%body%", file);
    return [file, css];
  }
}
function parse(path, vars = {}, source, index) {
  const class_name = "uhc" + hash();
  source.push(basename(path));
  let file = index ? index : readFileSync(path, "utf-8");
  path = resolve(path, "../");

  //comments
  if (config.comments != false)
    file = file.replaceAll(/\/\*(.||\n)*\*\//g, "");

  let js = "";
  const scripts = file.match(
    new RegExp("<script(.||\n)[^>]*>(.||\n)*</script( )*>", "g")
  );
  if (scripts) {
    for (const script of scripts) {
      js += script;
      file = file.replace(script, "");
    }
  }

  let css = "";
  [file, css] = parseCss(file, class_name);
  if (config.statments != false) file = parseStatments(file, vars, source);
  if (config.vars != false) file = parseBlock(file, vars, source);
  file = addClassName(file, class_name);

  const temp = checkImports(file, vars, path, class_name, source);
  temp[1] += css;
  temp[0] += js;
  return temp;
}
function checkTemplate(file, path) {
  let body = file.match(new RegExp("%body%", "g"));
  if (!body) warn("%body% not found in " + path);
  else if (body.length - 1) warn("multiple %body% found in " + path);

  let head = file.match(new RegExp("%head%", "g"));
  if (!head) warn("%head% not found in " + path);
  else if (head.length - 1) warn("multiple %head% found in " + path);
}

function parseStatments(file, vars, source) {
  let matches = file.match(/\((.||\n)[^\(\)]*\)\s*{(.||\n)[^{}]*}/g);
  if (matches) {
    for (const loop of matches) {
      let count = loop.match(/\((.||\n)[^\(\)]*\)/)[0].slice(1, -1);
      let content = loop.match(/{(.||\n)*}/)[0].slice(1, -1);
      try {
        count = run(count, vars);
      } catch (e) {
        error(`while executing (${count})\n ${e.message}`, source);
      }
      if (Number(count)) content = content.repeat(count);
      else if (!count) content = "";
      file = file.replace(loop, content);
    }
    return parseStatments(file, vars);
  } else return file;
}

function addClassName(file, class_name) {
  const headTags = file.match(new RegExp("<[^/](.||\n)[^<>]*/*>", "g"));
  if (headTags) {
    for (const headTag of headTags) {
      if (headTag.includes("class="))
        file = file.replace(
          headTag,
          headTag.replace('class="', ` class="${class_name} `)
        );
      else {
        const temp = headTag.endsWith("/>") ? "/>" : ">";
        file = file.replace(
          headTag,
          headTag.replace(temp, ` class="${class_name}"${temp}`)
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

function parseBlock(file, vars, source) {
  const statments = file.match(/\${(.||\n)[^}]*}/g);
  if (statments) {
    for (const statment of statments) {
      const code = statment.slice(2, -1).trim();
      try {
        file = file.replace(statment, run(code, vars));
      } catch (e) {
        error("while executing " + code + "\n" + e.message, source);
      }
    }
  }
  return file;
}

function parseSvg(path, vars) {
  let file = readFileSync(path, "utf-8");
  const ignore = ["type", "path"];
  for (const key in vars) {
    if (!ignore.includes(key))
      file = file.replace("<svg", `<svg ${key}="${vars[key]}"`);
  }
  return file;
}

function run(code, context) {
  createContext(context);
  runInContext(`x_=${code}`, context);
  return context.x_;
}

function checkImports(file, variables, path, class_name, source) {
  const imports = file.match(new RegExp("<import(.||\n)[^>]*/>", "gi"));
  let css = "";
  let last_import;
  if (imports) {
    for (const imp of imports) {
      const vars = checkAttributes(imp);
      if (!vars.path) {
        if (!last_import)
          error("path not specified for import\n" + imp, source);
        else vars.path = last_import;
      }
      const importPath = import_path(vars.path, path, vars.type);
      if (!existsSync(importPath))
        error(
          `no such file ${importPath}\n${imp}`,
          source
        );
      if (vars.type == "svg") {
        file = file.replace(
          imp,
          parseSvg(importPath, vars)
        );
      } else {
        const [html, styles] = parse(
          importPath,
          {
            ...variables,
            ...vars,
          },
          source.slice()
        );
        css += styles;
        file = file.replace(imp, html);
      }
      last_import = vars.path;
    }
  }
  return [file, css];
}

function checkAttributes(tag) {
  const attributes = tag.match(/[a-z]+="(\n||.)[^"]*"/gi);
  const vars = {};
  vars.class = "";
  if (attributes) {
    for (let attribute of attributes) {
      attribute = attribute.slice(0, -1).split('="');
      if (attribute[0] == "class") vars.class += attribute[1];
      else vars[attribute[0]] = attribute[1];
    }
  }
  return vars;
}

function import_path(path, src, type) {
  if (!type) type = "html"
  type = "." + type;
  path = path.endsWith(type) ? path : path + type;
  return resolve(src, path);
}
