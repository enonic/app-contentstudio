const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');
const selenium = require('selenium-standalone');
//var argv = require('minimist')(process.argv.slice(2));

const testDir = './specs';

function runSelenium() {
    selenium.install(
        {logger: msg => console.log(msg)},
        function (error) {
            if (error) {
                return error;
            }
            selenium.start((error, child) => {
                if (error) {
                    return error;
                }
                selenium.child = child;
            });
        }
    );
}

function stopSelenuim() {
    selenium.child.kill();
}

// runSelenium();

const mocha = new Mocha({
    reporter: 'mocha-multi-reporters',
    reporterOptions: {
        reporterEnabled: 'mocha-allure-reporter, list'
    }
});

console.log("!!!!!!!!!!Test file is  :" + process.env.t_name);
const testFile = process.env.t_name;
(() => {
    console.log("test file is  " + testFile);
    if (testFile == undefined) {
        throw new Error("test file should be specified");
    } else {
        mocha.addFile(
            path.join(testDir, testFile)
        );
    }
})();

mocha.run(exitCode => {
    // stopSelenuim();
    if (exitCode !== 0) {
        process.exit(exitCode);
    }
});