const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');

const XPATH = {
    container: `//div[contains(@id,'ContentUnpublishDialog')]`,
    dialogHeader: "//div[contains(@id,'ModalDialogHeader')]//h2[@class='title']",
    dialogSubheader: "//div[contains(@id,'ModalDialogHeader')]//h6[@class='sub-title']",
    unpublishButton: "//button[contains(@id,'DialogButton') and descendant::span[contains(.,'Unpublish')]]",
    cancelButtonBottom: "//button[contains(@class,'cancel-button-bottom')]",
    dialogMainItemListUl: "//ul[contains(@id,'DialogMainItemsList')]",
    itemBlock: displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,
};

class ContentUnpublishDialog extends Page {

    get dependantsBlock() {
        return XPATH.container + lib.DEPENDANTS.DEPENDANTS_BLOCK
    }

    get cancelButtonBottom() {
        return XPATH.container + XPATH.cancelButtonBottom;
    }

    get header() {
        return XPATH.container + XPATH.dialogHeader;
    }

    get subheader() {
        return XPATH.container + XPATH.dialogSubheader;
    }

    get unpublishButton() {
        return XPATH.container + XPATH.unpublishButton;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.unpublishButton, appConst.mediumTimeout);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    async clickOnUnpublishButton() {
        await this.waitForElementEnabled(this.unpublishButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.unpublishButton);
    }


    async getItemDisplayName() {
        try {
            let locator = XPATH.container + XPATH.dialogMainItemListUl + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_unpublish_dlg');
            throw new Error(`Content Unpublish Dialog - Error during getting items in main items list,  screenshot: ${screenshot} ` + err);
        }
    }

    getDependentItemsPath() {
        let locator = XPATH.container + lib.DEPENDANTS.DEPENDENT_ITEM_LIST_UL + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }

    getDialogHeader() {
        return this.getText(this.header);
    }

    getDialogSubheader() {
        return this.getText(this.subheader);
    }

    async getNumberInUnpublishButton() {
        let locator = XPATH.container + XPATH.unpublishButton + '//span';
        let label = await this.getText(locator);
        let startIndex = label.indexOf('(');
        let endIndex = label.indexOf(')');
        return label.substring(startIndex + 1, endIndex);
    }

    async getItemStatus(displayName) {
        let locator = XPATH.container + XPATH.itemBlock(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dependencies_block');
            throw new Error(`Unpublish dialog, Dependencies block is not displayed, screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = ContentUnpublishDialog;

