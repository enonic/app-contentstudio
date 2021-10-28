const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');
const selenium = require('selenium-standalone');
const testFilesGlob = glob.sync('../specs/project/*.js', {cwd: __dirname});
const PropertiesReader = require('properties-reader');
const file = path.join(__dirname, '/../browser.properties');
const properties = PropertiesReader(file);
const driverVersion = properties.get('chromedriver.version');
const seleniumVersion = properties.get('selenium.version');

const mocha = new Mocha({
    reporter: 'mochawesome',
    reporterOptions: {
        reportDir: 'build/mochawesome-report',
        reportFilename: 'results',
        quiet: true
    }
});

function execute() {
    return new Promise((resolve) => {
        mocha.run((failures) => {
            if (failures === 0) {
                return resolve();
            }
            process.exit(failures);
        });
    });
}

function addFiles() {
    return new Promise((resolve) => {
        testFilesGlob.forEach(function (file) {
            file = path.join(__dirname, file);
            console.log(file);
            mocha.addFile(file);
        });
        resolve();
    });
}

async function runTests() {
    await addFiles();
    await execute();
}

async function uiTests() {
    try {
        console.log("Download chrome driver and Selenium server");
        await selenium.install({
            version: seleniumVersion,
            baseURL: 'https://selenium-release.storage.googleapis.com',
            drivers: {
                chrome: {
                    version: driverVersion,
                    arch: process.arch,
                    baseURL: 'https://chromedriver.storage.googleapis.com'
                },
            }
        });

        console.log("Start selenium server");
        const seleniumChildProcess = await selenium.start({
            drivers: {
                chrome: {
                    version: driverVersion,
                },
            }
        });
        await runTests();
        console.log("Stop Selenium server: ");
        await seleniumChildProcess.kill();
    } catch (err) {
        console.log("Selenium error############: " + err);
        process.exit(1);
    }
}

uiTests();
