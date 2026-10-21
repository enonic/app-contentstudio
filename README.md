Content Studio - Authoring interface for Enonic XP
===

[![Actions Status](https://github.com/enonic/app-contentstudio/workflows/Gradle%20Build/badge.svg)](https://github.com/enonic/app-contentstudio/actions)
[![License][license-image]][license-url]
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/058e2e1b329b41e38a00769827b7912b)](https://www.codacy.com/gh/enonic/app-contentstudio/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=enonic/app-contentstudio&amp;utm_campaign=Badge_Grade)
[![Enonic XP 8](https://market.enonic.com/badges/xp8.svg)](https://market.enonic.com/vendors/enonic/content-studio)

Manage your content stored in [Enonic XP](https://github.com/enonic/xp). The documentation can be found [here](https://developer.enonic.com/docs/content-studio/stable).

## Free Core. Forever.

The foundational features of Content Studio — browsing, creating, and editing content, visual page editor, and basic publishing workflow — are always free to use for everyone. Build, launch, and host it for yourself or your clients without a subscription. The source code is publicly available right here on GitHub. Our [Subscription and hosting plans](https://www.enonic.com/pricing) give access to enterprise features such as AI, advanced governance, and commercial support.

[!NOTE] 
Content Studio provides extensions points for anyone to implement custom features under any license, without modifying and maintaining Content Studio itself.

### Why the Enonic License?

As of Content Studio 6, this project is licensed under the [Enonic License 2.0](LICENSE.txt). The new license lets us ship previously separate applications — Content Studio+, AI features, and more — as a single app, simplifying maintenance for us and installation for you. Also eliminating any concerns related to the GPL license. It does not change how the core product works.

## Usage

Just copy the built JAR files to the `$XP_HOME/deploy` folder, or use the `deploy` task from the Gradle:

```
./gradlew deploy
```

## CSP extension contract

When rendering the Content Studio main tool (browse or content wizard), Content Studio calls
`/lib/xp/context.setCustomLocalAttribute('com.enonic.app.contentstudio.csp.enabled', enabled)`.
The value is a **boolean**: `false` only when `app.config['contentSecurityPolicy.enabled'] === 'false'`,
and `true` otherwise, including when the setting is absent.

The flag is set before template rendering and before XP invokes the tool's extension response processors.
Extensions can read it with
`require('/lib/xp/context').get().attributes['custom.com.enonic.app.contentstudio.csp.enabled']`.
Java processors can read the same prefixed key from `ContextAccessor.current().getLocalScope()`
(as a `GenericValue`, using `asBoolean()`). XP adds the `custom.` prefix; callers must not add it when writing.
An extension contributing CSP should skip that contribution when the value is explicitly `false`.

This is an execution-local signal, not a session setting or response header. It is shared with nested
context calls and the response processors for that tool request, but is not propagated to separate
extension API requests, preview pages, or other tools. An absent value is not an explicit opt-out.
It describes whether Content Studio applies its tool policy, not whether another component supplies CSP.
Requires an XP version providing `setCustomLocalAttribute`.


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
[license-image]: https://img.shields.io/badge/license-Enonic%20License%202.0-blue "Enonic License 2.0"
