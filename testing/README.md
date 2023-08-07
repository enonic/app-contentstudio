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
1. gradlew w_testInputTypes  run ui-tests with WDIO+chrome configuration.

2. Install allure, Manual installation:

   -Download the latest version as zip archive from Maven Central.
   https://repo.maven.apache.org/maven2/io/qameta/allure/allure-commandline/
     -Unpack the archive to allure-commandline directory.
     -Navigate to bin directory.
     -Use allure.bat for Windows or allure for other Unix platforms.
     -Add allure to system PATH.

Command for creating reports : allure generate 'available report folder path' && allure open
allure generate ./allureReports && allure open
