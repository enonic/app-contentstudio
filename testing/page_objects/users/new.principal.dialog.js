/**
 * Created on 10.04.2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'NewPrincipalDialog')]",
    itemViewer: "//div[contains(@id,'UserTypesTreeGridItemViewer')]",
    header: "//h2[@class='title']",
    expanderIconByName: function (name) {
        return lib.itemByDisplayName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
};

class NewPrincipalDialog extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButton);
    }

    //clicks on User, User Group, Id Provider....
    clickOnItem(itemName) {
        let selector = XPATH.itemViewer + lib.itemByDisplayName(itemName);
        return this.clickOnElement(selector)
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            throw new Error("New Principal dialog is not loaded in: " + appConst.mediumTimeout + " ms  " + err);
        }
    }

    async getNumberOfItems() {
        let items = XPATH.itemViewer + lib.H6_DISPLAY_NAME;
        let elements = await this.getDisplayedElements(items);
        return elements.length;
    }

    getItemNames() {
        let items = XPATH.itemViewer + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(items);
    }

    waitForExpanderIconDisplayed(name) {
        let selector = XPATH.container + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(selector, appConst.mediumTimeout).catch(err => {
            console.log("Expander is not visible " + err);
            return false;
        })
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_principal_dialog_close');
            throw new Error("New Principal Dialog was not closed  " + err);
        }
    }

    async clickOnExpanderIcon(name) {
        let selector = XPATH.container + XPATH.expanderIconByName(name);
        await this.clickOnElement(selector);
        return await this.pause(300);
    }

    waitForProviderNameDisplayed(name) {
        let selector = XPATH.container + XPATH.itemViewer + lib.itemByName(name);
        return this.waitForElementDisplayed(selector, appConst.shortTimeout);
    }
}
module.exports = NewPrincipalDialog;

