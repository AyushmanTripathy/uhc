import { readFileSync } from "fs";
import { resolve } from "path";

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
    let [body, head] = checkIndex(file, "\n" + path);
    [body, css] = parse(path, config.vars, css + body);
    return [`<!DOCTYPE html><html lang="en">${file + body}</html>`, css];
  } else {
    checkIndex(template," template file")
    const temp = parse(path, config.vars, css + file);
    file = temp[0]
    css = temp[1]
    const bodies = template.match(/<\/body(\s)*>/g);
    file = template.replace(/<\/body(\s)*>/, file + "</body>");
    return [file, css];
  }
}

function checkIndex(file, path) {
  let body = file.match(new RegExp("<body(.||\n)*</body( )*>", "g"));
  if (!body) error("body not found in input file " + path);
  if (body.length - 1) error("multiple body tags found in " + path);
  body = body[0];

  let head = file.match(new RegExp("<head(.||\n)*</heads*>", "g"));
  if (!head) error("head not found in input file " + path);
  if (head.length - 1) error("multiple head tags found in " + path);
  head = head[0];
  return [body, head];
}

function parse(path, vars = {}, index) {
  const class_name = "uhc" + hash();
  let file = index ? index : readFileSync(path, "utf-8");
  path = resolve(path, "../");

  //comments
  file = file.replaceAll(/\/\*(.||\n)*\*\//g, "");

  let css = "";
  [file, css] = parseCss(file, class_name);
  //file = checkLoops(file);
  file = addClassName(file, class_name);
  if (config.vars != false) file = checkVars(file, vars);
  const temp = checkImports(file, vars, path);
  temp[1] += css;
  return temp;
}

function checkLoops(file) {
  let loop = file.match(new RegExp("<loop(.||\n)*</loop( )*>", ""));
  if (loop) {
    loop = loop[0];
    log(loop);
    const count = checkAttributes(loop).count;
    if (!count) error("count not specified for loop\n" + loop);
    file = file.replace(
      loop,
      loop
        .replace(/<\/loop(\s)*>/, "")
        .replace(/<loop(.||\n)[^>]*>/, "")
        .repeat(count)
    );
    return checkLoops(file);
  } else return file;
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
  const statments = file.match(/\${(.)[^}]*}/g);
  if (statments) {
    for (const statment of statments) {
      const var_name = statment.slice(2, -1).trim();
      if (!vars[var_name]) warn(var_name + " is not defined");
      file = file.replace(statment, vars[var_name]);
    }
  }
  return file;
}

function checkImports(file, variables, path) {
  const imports = file.match(new RegExp("<import (.||\n)[^>]*/>", "gi"));
  let css = "";
  if (imports) {
    for (const imp of imports) {
      const vars = checkAttributes(imp);
      if (!vars.path) error("path not specified for import\n" + imp);
      const [html, styles] = parse(import_path(vars.path, path), {
        ...vars,
        ...variables,
      });
      css += styles;
      file = file.replace(imp, html);
    }
  }
  return [file, css];
}

function checkAttributes(tag) {
  const attributes = tag.match(/[a-z]+="(\n||.)[^"]*"/gi);
  const vars = {};
  if (attributes) {
    for (let attribute of attributes) {
      attribute = attribute.slice(0, -1).split('="');
      vars[attribute[0]] = attribute[1];
    }
  }
  return vars;
}

function import_path(path, src) {
  path = path.endsWith(".html") ? path : path + ".html";
  return resolve(src, path);
}
