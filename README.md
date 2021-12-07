# hhc

#### a helpful html compiler

install - `npm i hhc -g`
usage - `hhc input.html output.html`

why hhc?

- write your familiar html just with additional features
- import html components

```html
<import path="./file" foo="bar" />
```

- use vars passed to the components

```html
<p>hello $foo</p>
```

- no need to make up class names.

```html
<style>         |  <style>
p {             | p.hhc1 {
}               | }
</style>        | </style>
<p> hello </p>  | <p class="hhc1"> hello </p>
```

- multi line comments we enjoy!

```js
/* comment */
```
