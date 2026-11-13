JavaScript UI Testing
===

WebdriverIO + Mocha tests for Content Studio. Specs live in `specs/`, page objects in `page_objects/`, shared helpers in `libs/`.

### Requirements

* Java 25 (the version used in CI)
* Node.js 24.15.0 and pnpm — Gradle downloads both, so they are only needed to run `pnpm` by hand
* Chrome

### Suites

Each suite is a WebdriverIO config in `wdio/`, built on `wdio/wdio.base.conf.js`, and a Gradle task in `build.gradle`.

| Gradle task | Specs | XP config |
|---|---|---|
| `testInputTypes` | `content-types/` | common |
| `testInputTypes_2` | `content-types-2/` | common |
| `testModalDialog` | `modal-dialog/` | common |
| `testWizardsGrid` | `specs/*.spec.js` | common |
| `testPublishIssues` | `publish/`, `issue/` | common |
| `testProjects` | `project/` | common |
| `testProjects_2` | `project-2/` | common |
| `testProjects_multi` | `project-multi/` | `project-multi-config` |
| `testPageEditor` | `page-editor/` | common |
| `testExcludeDependencies` | `exclude-dependencies/`, `misc2/`, `permissions/` | `custom-config` |
| `miscTests` | `misc/` | common |

All of them run in parallel in the `selenium-test` job of `.github/workflows/gradle.yml`.

### Running on a fresh XP

From the repository root:

```
./gradlew :testing:testInputTypes
```

The task downloads the XP distribution, copies the config from `test-config/` and the test applications into it, deploys `modules/app/build/libs/contentstudio.jar`, starts the server, runs the suite and stops the server. Reports and screenshots are written to `testing/build/reports/`.

### Running against a local XP

1. Start your local XP with the config from `test-config/common-config/` (or the config the suite needs, see the table).
2. Deploy the test applications listed in the `apps` configuration of `build.gradle`.
3. Run the `Local` variant of the task, e.g. `./gradlew :testing:testInputTypesLocal` or `./gradlew :testing:testInputTypes_2_Local`.

To run a single spec, narrow `specs` in the suite config. To watch the browser, remove `--headless=new` from `wdio/wdio.base.conf.js`.

### Timeouts

* `appConst.SUITE_TIMEOUT` (`libs/app_const.js`) bounds every test and every hook of a spec: each spec sets it with `this.timeout()`, which overrides `mochaOpts.timeout`.
* `connectionRetryTimeout` and `connectionRetryCount` in `wdio/wdio.base.conf.js` bound a single WebDriver request. A hung request blocks the worker for `connectionRetryTimeout × (connectionRetryCount + 1)`, so keep them low.
