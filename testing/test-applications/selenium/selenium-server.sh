#!/bin/sh

detectOS() {
    cygwin=false;
    darwin=false;
    case "`uname`" in
        CYGWIN*)
            cygwin=true
            ;;
        Darwin*)
            darwin=true
            ;;
    esac
}

locateJava() {
    if [ -n "$JAVA_HOME" ] ; then
        if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
            JAVACMD="$JAVA_HOME/jre/sh/java"
        else
            JAVACMD="$JAVA_HOME/bin/java"
        fi
        if [ ! -x "$JAVACMD" ] ; then
            die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME."
        fi
    else
        JAVACMD="java"
        which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
    fi
}


init() {
    detectOS
    locateJava
}

run() {
    java -Dwebdriver.chrome.driver=test-applications/selenium/chromedriver -jar test-applications/selenium/selenium-server-standalone-3.4.0.jar
}

main() {
    init
    run
}

main
