@echo off

:execute
java -Dwebdriver.chrome.driver=./test-applications/selenium/chromedriver.exe -jar ./test-applications/selenium/selenium-server-standalone-3.4.0.jar

endlocal
