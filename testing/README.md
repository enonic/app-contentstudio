Users JavaScript UI Testing
===

### Building

Before trying to run tests, you need to verify that the following software are installed:

* Java 11 for building and running;
* node.js installed on system;
* Git installed on system;
* Chrome browser installed on system.

Run tests for app-admin-home.
go to '/testing' folder and run:
  1. gradle testContentStudioApp
  2. gradle testContentStudioAppLocally  ( --project-cache-dir d:/cache)
  3. gradle runSeparateTestLocally -Pt_name=overwrite.permissions.spec  --project-cache-dir d:/cache
  4. gradlew testContentStudioProjects  --project-cache-dir d:/cache
  5. gradlew baseContentStudioTests  --project-cache-dir d:/cache
  

### Reporting 
