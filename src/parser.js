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
    let body = file.match(new RegExp("<body(.||\n)*</body( )*>", "g"));
    if (!body) error("body not found in input file");
    if (body.length - 1) error("multiple body tags found");
    body = body[0];

    file = file.match(new RegExp("<head(.||\n)*</heads*>", "g"));
    if (!file) error("head not found in input file");
    if (file.length - 1) error("multiple head tags found");
    file = file[0];

    [body, css] = parse(css + body, config.vars, 1);
    return [`<!DOCTYPE html><html lang="en">${file + body}</html>`, css];
  } else {
    [file, css] = parse(css + file, config.vars, 1);
    file = template.replace(/<\/body(\s)*>/, file + "</body>");
    return [file, css];
  }
}

function parse(input, vars = {}, isIndex) {
  const class_name = "uhc" + hash();
  let file = isIndex ? input : readFileSync(input, "utf-8");

  //comments
  file = file.replaceAll(/\/\*(.||\n)*\*\//g, "");

  let css = "";
  [file, css] = parseCss(file, class_name);
  file = checkLoops(file);
  file = addClassName(file, class_name);
  file = checkVars(file, vars);
  const temp = checkImports(file, vars);
  temp[1] += css;
  return temp;
}

function checkLoops(file) {
  let loop = file.match(new RegExp("<loop(.||\n)*</loop( )*>", ""));
  if (loop) {
    loop = loop[0];
    const count = checkAttributes(loop).count;
    if (!count) error("count not specified for loop\n" + loop);
    file = file.replace(
      loop,
      loop
        .replaceAll(/<\/loop(\s)*>/g, "")
        .replaceAll(/<loop(.||\n)[^>]*>/g, "")
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
      if (!vars[var_name]) error(var_name + " is not defined");
      file = file.replace(statment, vars[var_name]);
    }
  }
  return file;
}

function checkImports(file, variables) {
  const imports = file.match(new RegExp("<import (.||\n)[^>]*/>", "gi"));
  let css = "";
  if (imports) {
    for (const imp of imports) {
      const vars = checkAttributes(imp);
      if (!vars.path) error("path not specified for import\n" + imp);
      const [html, styles] = parse(path(vars.path), { ...vars, ...variables });
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

function path(path) {
  path = path.endsWith(".html") ? path : path + ".html";
  return resolve(from_dir, path);
}
