/**
 * Created on 15.07.2021.
 */

const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'InsertablesPanel')]",
    components: "//div[contains(@class,'grid-row')]//div[contains(@class,'comp ui-draggable')]//h5",
    title: "Drag and drop components into the page",
};

class InsertablesPanel extends Page {

    get title() {
        return xpath.container + "/p";
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_panel');
            throw new Error('Live Edit, Insert Panel is not opened' + err);
        });
    }

    getItems() {
        let locator = xpath.container + xpath.components;
        return this.getTextInDisplayedElements(locator);
    }
}

module.exports = InsertablesPanel;

