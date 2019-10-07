const path = require('path');
const fs = require('fs');
const globby = require('globby');
const Mocha = require('mocha');
const selenium = require('selenium-standalone');
const testFilesGlob = './specs/**/*.js';


function runSelenium() {
    selenium.install(
        {logger: msg => console.log(msg)},
        function (error) {
            if (error) {
                console.log("Error 1")
                return error;
            }
            selenium.start((error, child) => {
                if (error) {
                    console.log("Error 2 " + error);
                    return error;
                }
                console.log("Selenium server is started!")
                selenium.child = child;
            });
        }
    );
}

function stopSelenuim() {
    selenium.child.kill();
}

const mocha = new Mocha({
    reporter: 'mochawesome',
    reporterOptions: {
        reportFilename: 'results',
        quiet: true
    }
});

(async () => {
    const paths = await globby([testFilesGlob]);
    await runSelenium();
    paths.forEach(function (filePath) {
        console.log(filePath);
        mocha.addFile(filePath);
    });

    mocha.run(exitCode => {
        stopSelenuim();
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    });
})();
