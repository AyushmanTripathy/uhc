# CHANGELOG FOR UHC

## 2.0.1

#### ADDED

- version `-v` option

## 2.0.0

#### ADDED

- own live server.
- importing svg files.

## 1.9.0

#### ADDED

- added dev.js

#### CHANGES

- replaced live-server with websockets.

## 1.8.0

#### ADDED

- minify output
- sources to errors
- partial source map support

## 1.7.1

#### ADDED

- dynamic importing.

#### BUGS FIXED

- class name regex bug.

## 1.7.0

#### ADDED

- check path before importing.
- conditional flow
- add javascript in ${}
- loops

#### CHANGES

- parse script tags separate from html.
- refresh template on recompile.

## 1.6.0

#### ADDED

- init command
- added %head% %body% in template

#### CHANGES

- removed template optional support.

## 1.5.0

#### ADDED

- added version check
- load environment vars

#### CHANGES

- reorganised init function into init, checkArgs and loadConfig.

## 1.4.1

- update to btss 1.1.0

## 1.4.0

#### ADDED

- added dev mode

#### CHANGES

- replaced recursive-watch with chokidar

#### BUGS FIXED

- fix pareIndex file refrence error

## 1.3.0

#### ADDED

- template
- routing

#### CHANGES

- use relative path to import component.

#### BUGS FIXED

- fixed regex error in compileRoute

## 1.2.0

#### ADDED

- watch mode
- postcss
- autoprefixer

## 1.1.0

#### CHANGES

- inherit vars from parents
- change $foo => ${foo}

#### BUGS FIXED

- file.match returning null error

## 1.0.0

#### ADDED

- importing html components
- comments
- scss support
- help function
- css support
- $foo vars

#### BUGS FIXED

- removed // comments
- style tag regex error
