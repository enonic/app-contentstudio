/**
 * Created on 6/19/2017.
 */

const Page = require('./page');
const appConst = require('../libs/app_const');

const xpTourDialog = {
    container: `//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]`
};
const home = {
    container: `div[class*='home-main-container']`
};

class HomePage extends Page {

    get closeXpTourButton() {
        return `${xpTourDialog.container}//div[@class='cancel-button-top']`;
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(home.container, appConst.TIMEOUT_3);
    }
};
module.exports = HomePage;