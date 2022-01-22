# CHANGELOG FOR UHC

## 1.7.0
## ADDED
- refresh template on recompile.
- check path before importing.
## CHANGES
## 1.6.0

## ADDED

- init command
- added %head% %body% in template

## CHANGES

- removed template optional support.

## 1.5.0

### ADDED

- added version check
- load environment vars

### CHANGES

- reorganised init function into init, checkArgs and loadConfig.

## 1.4.1

- update to btss 1.1.0

## 1.4.0

### ADDED

- added dev mode

### CHANGES

- replaced recursive-watch with chokidar

### BUGS FIXED

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
