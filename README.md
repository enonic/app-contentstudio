Enonic XP - Content Studio App
===

[![Actions Status](https://github.com/enonic/app-contentstudio/workflows/Gradle%20Build/badge.svg)](https://github.com/enonic/app-contentstudio/actions)
[![License][license-image]][license-url]
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/058e2e1b329b41e38a00769827b7912b)](https://www.codacy.com/gh/enonic/app-contentstudio/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=enonic/app-contentstudio&amp;utm_campaign=Badge_Grade)

Create sites and manage content in [Enonic XP](https://github.com/enonic/xp). The documentation can be found [here](https://developer.enonic.com/docs/content-studio/stable).

## Usage

Just copy the built JAR files to the `$XP_HOME/deploy` folder, or use the `deploy` task from the Gradle:

```
./gradlew deploy
```

## Building

#### Default

Run the following command to build the application with default options:

```
./gradlew build
```

With default build, the application will use the remote `lib-admin-ui` dependency and production environment.

#### Environment

To use the development environment (unminifed sources, source maps etc.), you must set its value explicitly with `env` parameter (only `prod` or `dev` supported):

```
./gradlew build -Penv=dev
```

If the environment is set, the Gradle will look for the local `lib-admin-ui` and `xp` repositories in the parent folder of your `app-contentstudio` repo. And if any present, will build them, along with building applications, instead of downloading the remote `lib-admin-ui` dependency.
The environment parameter will also be passed to `lib-admin-ui`.

Both environments are almost identical, except that building in the development environment will result in creating the DTS files, sourcemaps and other things, critical for the debugging.
The build itself may also be a bit slower sometimes.

#### Content Studio library

It's possible to build `lib-contentstudio` containing `d.ts` files for Typescript classes of the Content Studio application. This library can then be used
to inherit from the Content Studio's Typescript classes in another application.

To build the library and deploy it to your local Maven repository:

```
./gradlew :lib-contentstudio:pTML -Plib
```

#### Quick

Sometimes, you may want to build your project faster. To do so, just skip the linting (`lint` task) and testing (`test` task):

```
./gradlew build -x lint -x test
```

In cases, when you set the environment type explicitly, skipping the `lint` or `test` will also result in skipping those two tasks in local `lib-admin-ui` build.

#### Clean

To rebuild the project from scratch, you may want to remove all compiles sources and dependencies.

```
./gradlew clean
```

<!-- Links -->
[license-url]:   LICENSE.txt
[license-image]: https://img.shields.io/github/license/enonic/app-contentstudio.svg "GPL 3.0"
