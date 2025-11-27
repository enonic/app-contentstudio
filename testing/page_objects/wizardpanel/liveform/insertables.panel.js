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

// Context Window - Insert tab of Page widget
class InsertablesPanel extends Page {

    get title() {
        return xpath.container + '/p';
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Insert tab in Page widget should be loaded', 'err_open_insert_tab', err);
        }
    }

    async getItems() {
        try {
            let locator = xpath.container + xpath.components;
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            await this.handleError('Insert tab in Page widget, get items', 'err_insert_tab_items', err);
        }
    }
}

module.exports = InsertablesPanel;

