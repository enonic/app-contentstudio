const path = require('path');
const fs = require('fs');
const globby = require('globby');
const Mocha = require('mocha');
const selenium = require('selenium-standalone');
const testFilesGlob = './specs/project/*.js';

const testDir = './specs';
const mocha = new Mocha({
    reporter: 'mochawesome',
    reporterOptions: {
        reportDir: 'build/mochawesome-report',
        reportFilename: 'results',
        quiet: true
    }
});

function stopSelenuim() {
    selenium.child.kill();
}

//console.log("!!!!!!!!!!Test file is  :" + process.env.t_name);
//const testFile = process.env.t_name;
const testFile = "wizard.xdata.long.form.spec.js"

async function runTest() {
    console.log("#################Test is starting! !")
    if (testFile == undefined) {
        throw new Error("test file should be specified");
    } else {
        mocha.addFile(
            path.join(testDir, testFile)
        );
    }
    mocha.run(function (exitCode) {
        stopSelenuim();
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    });
}

function runSeleniumTests() {
    selenium.install(
        {
            version: '3.141.59',
            baseURL: 'https://selenium-release.storage.googleapis.com',
            drivers: {
                chrome: {
                    version: '80.0.3987.106',
                    arch: process.arch,
                    baseURL: 'https://chromedriver.storage.googleapis.com'
                }
            },

            logger: msg => console.log(msg)
        },
        function (error) {
            if (error) {
                console.log("Selenium server is not started! 1" + error);
                return error;
            }
            selenium.start({
                version: '3.141.59',
                drivers: {
                    chrome: {
                        version: '80.0.3987.106'
                    }
                }
            }, (error, child) => {

                if (error) {
                    console.log("Selenium server is not started 2 !" + error);
                    return error;
                }
                console.log("Selenium server is started!")
                selenium.child = child;
                runTest();
            });
        }
    );
}

runSeleniumTests();
