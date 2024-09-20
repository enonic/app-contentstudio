/**
 * Created on 15.07.2021.
 */

const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'InsertablesPanel')]",
    gridUL: "//ul[contains(@id,'InsertablesGrid')]",
    components: "//li[contains(@class,'comp ui-draggable')]//h5",
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

    async getItems() {
        try {
            let locator = xpath.container + xpath.components;
            let result = await this.findElements(xpath.container);
            let result2 = await this.findElements(locator);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_insertables_panel');
            throw new Error(`Insertables panel, items, screenshot:${screenshot}` + err);
        }
    }
}

module.exports = InsertablesPanel;

