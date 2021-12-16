# UHC

#### (useful html compiler)

why?

- importing components

```html
<import path="./component.html" foo="bar" />
```

- variables

```html
<p>hello ${foo}</p>
```

- don't waste time on multiple configs just one, uhc.config.json.
- install just one package, no need to manage plugins.
- sass && postcss support.
- `/**/` comments

## Configs

**uhc.config.json**

```json
{
  "src_dir": "src",
  "build_dir": "public",
  "css": {
    "autoprefix": true,
    "prefix": "@import \"./global.scss\";",
    "scss": {
      "enabled": true,
      "source_map": true
    }
  },
  "vars": {
    "foo": "bar"
  }
}
```

## options

| option | function                 |
| ------ | ------------------------ |
| h      | help                     |
| g      | generate uhc.config.json |
| c      | load config              |

plz create an [issue](https://github.com/AyushmanTripathy/uhc/issues) to report any **bugs** or recommend us **features** we should add.

#### thank you for using uhc
