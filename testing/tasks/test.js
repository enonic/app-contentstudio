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
    reporter: 'mochawesome',
    reporterOptions: {
        reportFilename: 'results',
        quiet: true
    }
});

(async () => {
    const paths = await globby([testFilesGlob]);

    paths.forEach(function(filePath){
        console.log(filePath);
        mocha.addFile(filePath);
    });

    mocha.run(exitCode => {
        // stopSelenuim();
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    });
})();
