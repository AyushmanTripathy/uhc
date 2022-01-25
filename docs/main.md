# Introduction

UHC, The useful html compiler, for when you don't need a javascript framework.

### Why?

- html components.

```html
<import path="./component.html" foo="bar" />
```

- variables.

```html
<p>hello ${foo}</p>
```

- conditional flow & loops.
- basic html routing.
- minimal configration needed.
- sass and postcss support by default.
- compiles to raw html.
- and much much more!

### How?

1. install uhc globally

```
npm install uhc -g
```

2. start a new project

- use a skeleton uhc app.

```
uhc init app_name
```

- or start from scratch with -g to generate uhc.config.json

3. run `uhc` to compile.
4. run `uhc dev` to start dev mode

# Cli

### options

| option | function                 |
| ------ | ------------------------ |
| h      | help                     |
| g      | generate uhc.config.json |
| c      | load config              |
| w      | watch path               |

## Commands

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

- uhc.config.json should be placed in root directory.
- use `uhc -g` to generate uhc.config.json.
- by default uhc will look for uhc.config.json in current working directory.
  use `-c` to pass a custom path.
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

- some functions can be disabled by setting property to false in uhc.config.json.

| functions            | property  |
| -------------------- | --------- |
| variables            | vars      |
| if statments & loops | statments |
| comments             | comments  |

# Component format

- stylesheets added using link tag are not compiled.
- load path for sass is the index file.
- an example component

```html
<style>
  // css or sass styles
  main {
    color: red;
  }
</style>

<h1>title</h1>
<main>
  <p>some text</p>
  <import path="some other component" />
</main>
```

# Importing

- import component using import tag.

```html
<import path="./component" />
```

# Variables

- variables can be used by `${}` syntax.
- `${}` can perform javascript.

```html
<p>hello ${ foo + "something" }</p>
```

- vars can be globally declared from uhc.config.json.
- setting vars to false will disable vars.

```json
"vars": {
  "foo": "bar"
},
```

- vars can be passed to component from import tag.
- components inherit vars from thier parents.

```html
<import path="./component" foo="bar" />
```

# Conditional Flow

- `(){}` syntax become an if statment if input is a boolean.

```html
(10 == n) {
<p>hello world</p>
}
```

- else if / else are not supported yet. coming soon.

# Loops

- `(){}` syntax becomes an loop if input is a number.

```html
(n) {
<p>hello world</p>
}
```

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
- compiled code will replace %head% & %body% respectively.

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
    %head%
  </head>
  <body>
    %body%
  </body>
</html>
```
