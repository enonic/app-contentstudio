const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');
const selenium = require('selenium-standalone');
const testDir = './specs'

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

fs.readdirSync(testDir).filter(file=>{
    // Only keep the .js files
    return file.substr(-3) === '.js';

}).forEach(function(file){
    mocha.addFile(
        path.join(testDir, file)
    );
});
mocha.run(result => {
    // stopSelenuim();
});