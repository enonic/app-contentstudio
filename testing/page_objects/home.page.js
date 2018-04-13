/**
 * Created on 6/19/2017.
 */

const page = require('./page');
var xpTourDialog = {
    container: `div[class*='xp-tour']`
};
const home = {
    container: `div[class*='home-main-container']`
};
var homePage = Object.create(page, {

    closeXpTourButton: {
        get: function () {
            return `${xpTourDialog.container} div[class='cancel-button-top']`
        }
    },
    waitForXpTourVisible: {
        value: function (ms) {
            return this.waitForVisible(`${xpTourDialog.container}`, ms).catch(err=> {
                return false;
            })
        }
    },
    isXpTourVisible: {
        value: function () {
            return this.isVisible(`${xpTourDialog.container}`);
        }
    },
    waitForLoaded: {
        value: function (ms) {
            return this.waitForVisible(`${home.container}`, ms);
        }
    },
    doCloseXpTourDialog: {
        value: function () {
            return this.doClick(this.closeXpTourButton);
        }
    },
});
module.exports = homePage;
