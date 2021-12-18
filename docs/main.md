# Introduction

UHC, the useful html compiler, for when you don't need a javascript framework.

# Config

- uhc.config.json is one config you will ever need.
- use `uhc -g` to generate uhc.config.json.
- all other paths should be relative to src and build dir accordingly.

```json
{
  "src_dir": "src",
  "build_dir": "public",
  "template": "template.html",
  "css": {
    "autoprefix": true,
    "prefix": "@import \"./global.scss\";",
    "sass": true
  },
  "vars": {
    "foo": "bar"
  },
  "routes": {
    "/": "index.html"
  }
}
```

# Component format

- stylesheets linked are not compiled.
- styles in components are encapsulated, so you don't have to guess selectors.
- css are collected and then sass and postcss are applied afterwards.
- load path for sass is the index file.
- an example component

```html
<style>
  main {
    // css styles
  }
</style>

<h1>title</h1>
<main>
  <p>some text</p>
  <import path="some other component" />
</main>
```

# Importing

```html
<import path="./component" />
```

# Variables

- variables can be used by `${}` syntax.

```html
<p>hello ${ foo }</p>
```

- vars can be globally declared from uhc.config.json.
- setting vars to false will disable vars.

```json
"vars": {
  "foo": "bar"
},
```

- vars can be passed to component from then import tag.
- components inherit vars from thier parents.

```html
<import path="./component" foo="bar" />
```

#### NOTE

- uhc is a compiler so `${}` cannot perform any math or logic.
- `${}` cannot contain `\n`.

# Routes

- Routes are used to compile diffrent html files.

```json
"routes": {
  "/": "index.html",
  "project": {
    "/": "project.html",
    "table": "table.html"
  },
  "settings": "settings.html"
}
```

- Directory structure it creates.

```
build/
├── index.html
├── project
│   ├── index.html
│   └── table.html
└── settings.html
```

| url                            | html          |
| ------------------------------ | ------------- |
| website.com/                   | index.html    |
| website.com/project            | project.html  |
| website.com/project/table.html | table.html    |
| website.com/settings.html      | settings.html |

# Template

- template are used share code across diffrent routes.
- templates must have a body tag where compiled code is injected.
- templates itself will not be compiled.
- templates are optional.

```
"template":"template.html",
```

- an example template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="./icon.png" />
    <link rel="stylesheet" href="./global.css" />
    <title>Website</title>
    // compiled css will be injected here.
  </head>
  <body>
    // compiled html will be injected here.
  </body>
</html>
```
