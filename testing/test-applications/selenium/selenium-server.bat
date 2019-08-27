@echo off

:execute
java -Dwebdriver.chrome.driver=./test-applications/selenium/chromedriver.exe -jar ./test-applications/selenium/selenium-server-standalone-3.9.0.jar

endlocal
