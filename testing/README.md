Users JavaScript UI Testing
===

### Building

Before trying to run tests, you need to verify that the following software are installed:

* Java 11 for building and running;
* node.js installed on system;
* Git installed on system;
* Chrome browser installed on system.

Go to 'app-contentstudio' directory and run tests:

1. gradlew testContentStudioApp
2. gradlew testContentStudioAppLocally  ( --project-cache-dir d:/cache)
3. gradlew runSeparateTestLocally -Pt_name=overwrite.permissions.spec --project-cache-dir d:/cache
4. gradlew testContentStudioProjects --project-cache-dir d:/cache
5. gradlew baseContentStudioTests --project-cache-dir d:/cache
6. gradlew testPublishIssues --project-cache-dir d:/cache
7. gradlew testWizardsGrid --project-cache-dir d:/cache
8. gradlew testInputTypes_2_Local --project-cache-dir d:/cache

run tests with geckodriver(Firefox browser):

1. gradlew testWizardsGridFirefoxLocal - run ui-tests on local started XP
2. gradlew testWizardsGridFirefox - downloads XP then starts the server then deploys applications and runs tests
3. gradlew testPageEditorFirefox
4. gradlew testInputTypesFirefox_2
5. gradlew testInputTypesFirefox

