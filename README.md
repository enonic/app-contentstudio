Enonic XP - Content Studio App
===

[![Actions Status](https://github.com/enonic/app-contentstudio/workflows/Gradle%20Build/badge.svg)](https://github.com/enonic/app-contentstudio/actions)
[![License][license-image]][license-url]
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/4fa8601d04634ceea2a38235734cd5c2)](https://www.codacy.com/manual/enonic/app-contentstudio?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=enonic/app-contentstudio&amp;utm_campaign=Badge_Grade)

Create sites and manage content in [Enonic XP](https://github.com/enonic/xp).

## Usage

Just copy the built JAR files to the `$XP_HOME/deploy` folder, or use the `deploy` task from the Gradle:

```
./gradlew deploy
```

## Building

#### Default

Run the following command to build all applications with default options:

```
./gradlew build
```

With default build, applications will use the remote `lib-admin-ui` dependency and the environment variable won't be set.

#### Environment

To use the specific environment, you must set its value explicitly with `env` parameter (only `prod` or `dev`):

```
./gradlew build -Penv=dev
```

If the environment is set, the Gradle will look for the local `lib-admin-ui` and `xp` repositories in the parent folder of your `app-contentstudio` repo. And if any present, will build them, along with building applications, instead of downloading the remote `lib-admin-ui` dependency.
The environment parameter will also be passed to `lib-admin-ui`.

Both environments are almost identical, except that building in the development environment will result in creating the DTS files, sourcemaps and other things, critical for the debugging.
The build itself may also be a bit slower sometimes. 

#### Quick

Sometimes, you may want to build your project faster. To do so, just skip the linting (`lint` task) and testing (`test` task):

```
./gradlew build -x lint -x test
```

In cases, when you set the environment type explicitly, skipping the `lint` or `test` will also result in skipping those two tasks in local `lib-admin-ui` build.

#### Clean

To rebuild the project from scratch, you may want to remove all compiles sources and dependencies. In that case, using `clean` command may not be enough. To remove the build and dependencies, use:

```
./gradlew flush
```

#### NPM upgrade

In case you want forcefully update all your node dependencies, use:

```
./gradlew npmInstallForce
```

Take a note, that you can also use aliases in Gradle, and `nIF` would be just enough to run `npmInstallForce`.

<!-- Links -->
[travis-url]:    https://travis-ci.org/enonic/app-contentstudio
[travis-image]:  https://travis-ci.org/enonic/app-contentstudio.svg?branch=master "Build status"
[license-url]:   LICENSE.txt
[license-image]: https://img.shields.io/github/license/enonic/app-contentstudio.svg "GPL 3.0"
