JavaScript UI Testing
===

### Building

Before trying to run tests, you need to verify that the following software are installed:

* Java 11 for building and running;
* node.js installed on system;
* Git installed on system;

There are 2 modes for running tests.

`Standalone` mode is convenient for running one suite(file) with tests
1. Start your local XP
2. Go to `/app-contentstudio/testing/` folder and install required libs  
    ``` npm install ```
3. make sure that your local configuration files do not differ from the files located in the folder `/app-contentstudio/testing/test-applications/common-config/`
4. copy all test-applications (`app-contentstudio/testing/test-applications/`) from  into your local `deploy` folder, these applications will import test data
5. Open a `*.spec` file in `Idea` and press 'Run' button in `Idea` toolbar
6. Specify the path to `Mocha package` in Idea-Run modal dialog: `app-contentstudio\testing\node_modules\mocha`

 After these steps special `Browser for testing` will be installed and started on your local environment
 While the tests are running, you should not perform any actions in you local Content Studio, as this may affect the test results


`WDIO` mode is suitable for testing on big scale.(on GitHub)
Start ui-tests on your local environment:
1. Start your local XP
2. make sure that your local configuration files do not differ from the files located in the folder `/app-contentstudio/testing/test-applications/common-config/`
3. copy all test-applications (`app-contentstudio/testing/test-applications/`) from  into your local `deploy` folder, these applications will import test data
4. open `app-contentstudio/testing/wdio/wdio.input_types.chrome.conf.js` in Idea and check the specifications that will be run.
   You can specify a single test or folder with files

    ``` specs: [
        path.join(__dirname, '../specs/content-types/*.spec.js')
    ],```
   
5. go to `app-contentstudio` and run the command: 
    ```gradlew w_testInputTypesLocal```  run ui-tests for Input Types

6. If you want to see how tests are executed in the browser, then remove ``headless`` option in `wdio.input_types.chrome.conf.js`

```
 'goog:chromeOptions': {
            "args": [
                "--headless", "--disable-gpu", "--no-sandbox",
                "--lang=en",
                '--disable-extensions',
                `window-size=${width},${height}`
            ]
```

```gradlew w_testInputTypes_2_Local``` run ui-tests for Input Types(the second part)
```gradlew w_testModalDialogLocal```   run ui-tests for common modal dialogs
```gradlew w_testWizardsGridLocal```   run ui-tests for Content Wizard and content grid
```gradlew w_testPublishIssuesLocal``` run ui-tests for creating issues, requests and Publish wizard
```gradlew w_testPageEditorLocal```    run ui-tests for Page Editor
```gradlew w_testProjectsLocal```      run ui-tests for Projects
```w_testHiddenDefProject```           run ui-tests with `settings.hideDefaultProject=true publishingWizard.excludeDependencies=true` properties



Start ui-tests on GitHub environment,  go to `app-contentstudio`:
 All these commands downloads XP distro, unpacks and starts the server(test apps will be copied to the `deploy` folder before the starting)
```gradlew w_testInputTypes```       run ui-tests for Input Types
```gradlew w_testInputTypes_2```     run ui-tests for Input Types(the second part)
```gradlew w_testModalDialog```      run ui-tests common modal dialogs
```gradlew w_testPageEditor```       run ui-tests for Page Editor
```gradlew w_testProjects```         run ui-tests for Projects


Specify all these tests-configs in ``gradle.yml``

```
selenium-test:
        strategy:
            fail-fast: false
            matrix:
                suite: [ w_testProjects, w_testProjects_2, w_testPageEditor, w_testInputTypes, w_testInputTypes_2, w_testWizardsGrid, w_testPublishIssues, w_testModalDialog, w_testHiddenDefProject ]
```

Test reports and screenshot you can find in the folder: ```app-contentstudio\testing\build\reports\``` 
