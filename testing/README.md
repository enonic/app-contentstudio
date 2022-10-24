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
2. gradlew runSeparateTestLocally -Pt_name=overwrite.permissions.spec --project-cache-dir d:/cache
3. gradlew testContentStudioProjects --project-cache-dir d:/cache
4. gradlew testPublishIssues --project-cache-dir d:/cache
5. gradlew testWizardsGrid --project-cache-dir d:/cache
6. gradlew testInputTypes_2_Local --project-cache-dir d:/cache
7. gradlew testPublishIssuesLocal
8. gradlew testWizardsGridLocal
9. gradlew testInputTypesLocal
10. gradlew testPageEditorLocal
11. gradlew testContentStudioProjectsLocal

run tests with geckodriver(Firefox browser):

1. gradlew testWizardsGridFirefoxLocal - run ui-tests on local started XP
   gradlew testPageEditorFirefoxLocal
2. gradlew testWizardsGridFirefox - downloads XP then starts the server then deploys applications and runs tests
3. gradlew testPageEditorFirefox
4. gradlew testInputTypesFirefox_2
5. gradlew testInputTypesFirefox
6. gradlew testContentStudioProjectsFirefox
7. For switching all tests to FF, specify the suite in gradle.yml:
   suite: [ testContentStudioProjectsFirefox, testPageEditorFirefox, testInputTypesFirefox, testInputTypesFirefox_2, testWizardsGridFirefox, testPublishIssuesFirefox, testModalDialogFirefox ]


