# Introduction

UHC, the useful html compiler, for when you don't need a javascript framework.

why?

- importing components

```html
<import path="./component.html" foo="bar" />
```

- variables

```html
<p>hello ${foo}</p>
```

- routing made easy.
- no need to involve npm, just install uhc globally.
- don't waste time on multiple configs just one, uhc.config.json.
- install just one package, no need to manage plugins.
- sass && postcss support.
- `/ ** /` comments

# Cli

- use `npm i uhc -g` to install uhc.
- `-c` option is still in development, usage is not recommended.

| option | function                 |
| ------ | ------------------------ |
| h      | help                     |
| g      | generate uhc.config.json |
| c      | load config              |
| w      | watch path               |

## commands

### Init

- run `uhc init` to create a skeleton uhc app.
- by default it creates a dir named uhc-app, run `uhc init <name>` to pass
  a name.

### Dev

- run `uhc dev` and see your site on [localhost:8080](http://localhost:8080/),
  uhc will also watch for file changes (using chokidar) in src directory and will
  recompile and reload the browser (using live-server) on changes.

- PORT can be passed as environment variable.

# Config

- uhc.config.json is one config you will ever need.
- use `uhc -g` to generate uhc.config.json.
- by default uhc will look for uhc.config.json in current working directory.
  use `-c` to pass a custom path. (Not Recommended yet!)
- all other paths should be relative to src and build dir accordingly.
- get environment variables from .env with load key.

```json
{
  "uhc": "<uhc_version>",
  "src_dir": "src",
  "build_dir": "public",
  "template": "template.html",
  "css": {
    "autoprefix": true,
    "prefix": "@import \"./global.scss\";",
    "sass": true
  },
  "load": ["KEYS"],
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
- if no template is specified, main component must have head and body tags.
- an example component

```html
<style>
  main {
    // css or sass styles
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

| url                            | html          |
| ------------------------------ | ------------- |
| website.com/                   | index.html    |
| website.com/project            | project.html  |
| website.com/project/table.html | table.html    |
| website.com/settings.html      | settings.html |

- Directory structure it creates.

```
build/
├── index.html
├── project
│   ├── index.html
│   └── table.html
└── settings.html
```

# Template

- template are used share code across diffrent routes.
- templates must have a body and head tag where compiled code is injected.
- templates itself will not be compiled.

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
    // compiled html and js will be injected here.
  </body>
</html>
```
