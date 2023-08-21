Users JavaScript UI Testing
===

### Building

Before trying to run tests, you need to verify that the following software are installed:

* Java 11 for building and running;
* node.js installed on system;
* Git installed on system;
* Chrome browser installed on system.

Go to 'app-contentstudio' directory and run tests:

Run tests with geckodriver(Firefox browser):

1. gradlew testWizardsGridFirefoxLocal - run ui-tests on local started XP
   gradlew testPageEditorFirefoxLocal
2. gradlew testWizardsGridFirefox - downloads XP then starts the server then deploys applications and runs tests
3. gradlew testPageEditorFirefox
4. gradlew testInputTypesFirefox_2
5. gradlew testInputTypesFirefox
6. gradlew testContentStudioProjectsFirefox
7. For switching all tests to FF, specify the suite in gradle.yml:
   suite: [ testContentStudioProjectsFirefox, testPageEditorFirefox, testInputTypesFirefox, testInputTypesFirefox_2, testWizardsGridFirefox, testPublishIssuesFirefox, testModalDialogFirefox ]

 Run tests with WDIO+chrome configuration:
1. gradlew w_testInputTypes
2. gradlew w_testModalDialog
