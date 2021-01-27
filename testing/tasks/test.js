const path = require('path');
const fs = require('fs');
const globby = require('globby');
const Mocha = require('mocha');
const selenium = require('selenium-standalone');
const testFilesGlob = './specs/**/*.js';
const PropertiesReader = require('properties-reader');
const file = path.join(__dirname, '/../browser.properties');
const properties = PropertiesReader(file);
const driverVersion = properties.get('chromedriver.version');
const seleniumVersion = properties.get('selenium.version');

const mocha = new Mocha({
    reporter: 'mochawesome',
    reporterOptions: {
        reportFilename: 'results',
        quiet: true
    }
});

function stopSelenuim() {
    selenium.child.kill();
}

async function runTests() {
    const paths = await globby([testFilesGlob]);
    paths.forEach(function (filePath) {
        if (!filePath.includes("project")) {
            console.log("test file: " + filePath);
            mocha.addFile(filePath);
        }
    });

    mocha.run(function (exitCode) {
        stopSelenuim();
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    });
}

function runSelenium() {
    console.log("SELENIUM VERSION - " + seleniumVersion);
    selenium.install(
        {
            version: seleniumVersion,
            baseURL: 'https://selenium-release.storage.googleapis.com',
            drivers: {
                chrome: {
                    version: driverVersion,
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
            console.log("CHROMEDRIVER VERSION - " + driverVersion);
            selenium.start({
                version: seleniumVersion,
                drivers: {
                    chrome: {
                        version: driverVersion
                    }
                }
            }, (error, child) => {

                if (error) {
                    console.log("Selenium server is not started 2 !" + error);
                    return error;
                }
                console.log("Selenium server is started!");
                selenium.child = child;
                runTests();
            });
        }
    );
}

runSelenium();
