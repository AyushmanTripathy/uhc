<img src="./icon.png" alt="UTC icon"/>

UHC, the useful html compiler, for when you don't need a javascript framework.

### Why?

- html components.

```html
<import path="./component.html" foo="bar" />
```

- variables.

```html
<p>hello ${foo}</p>
```

- basic html routing.
- minimal configration needed.
- sass and postcss support by default.
- compiles to raw html.

### How?

1. install uhc globally

```
npm install uhc -g
```

2. start a new project

- use a template

```
uhc init app_name
```

- or start from scratch with -g to generate uhc.config.json

3. run `uhc` to compile.
4. run `uhc dev` to start dev mode

check out the [DOCS](https://uhcjs.netlify.app/docs.html) to learn more! <br>
plz create an [issue](https://github.com/AyushmanTripathy/uhc/issues) to report any **bugs** or recommend us **features** we should add.

#### thank you for using uhc
