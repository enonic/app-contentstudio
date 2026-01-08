const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements-old');

const XPATH = {
    container: `//div[contains(@id,'ContentUnpublishDialog')]`,
    dialogHeader: "//div[contains(@id,'ModalDialogHeader')]//h2[@class='title']",
    dialogSubheader: "//div[contains(@id,'ModalDialogHeader')]//h6[@class='sub-title']",
    unpublishButton: "//button[contains(@id,'DialogButton') and descendant::span[contains(.,'Unpublish')]]",
    cancelButtonBottom: "//button[contains(@class,'cancel-button-bottom')]",
    dialogMainItemListUl: "//ul[contains(@id,'DialogWithRefsItemList')]",
    itemBlock: displayName => `//div[contains(@id,'ArchiveSelectableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,
    showReferencesButton(displayName) {
        return `//div[contains(@id,'ArchiveSelectableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/button[contains(@id,'ActionButton') and child::span[text()='Show references']]`;
    }
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

    get ignoreInboundReferencesButton() {
        return XPATH.container + lib.actionButton('Ignore inbound references');
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.unpublishButton, appConst.mediumTimeout);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    async waitForUnpublishButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.unpublishButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_unpublish_btn');
            throw new Error(`Unpublish button should be enabled in the dialog, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForUnpublishButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.unpublishButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_unpublish_btn');
            throw new Error(`Unpublish button should be disabled in the dialog, screenshot: ${screenshot}  ` + err);
        }
    }

    async clickOnUnpublishButton() {
        await this.waitForUnpublishButtonEnabled();
        return await this.clickOnElement(this.unpublishButton);
    }

    waitForIgnoreInboundReferencesButtonDisplayed() {
        return this.waitForElementDisplayed(this.ignoreInboundReferencesButton, appConst.mediumTimeout);
    }

    waitForIgnoreInboundReferencesButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.ignoreInboundReferencesButton, appConst.mediumTimeout);
    }

    async clickOnIgnoreInboundReferences() {
        try {
            await this.waitForIgnoreInboundReferencesButtonDisplayed();
            await this.clickOnElement(this.ignoreInboundReferencesButton);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Content Unpublish Dialog', 'err_ignore_inbound_ref', err);
        }
    }

    async clickOnShowReferencesButton(itemDisplayName) {
        let buttonLocator = XPATH.showReferencesButton(itemDisplayName);
        await this.waitForElementDisplayed(buttonLocator, appConst.mediumTimeout);
        await this.clickOnElement(buttonLocator);
        return await this.pause(2000);
    }

    async getItemDisplayName() {
        try {
            let locator = XPATH.container + XPATH.dialogMainItemListUl + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_unpublish_dlg');
            throw new Error(`Content Unpublish Dialog - Error occurred during getting items in main items list,  screenshot: ${screenshot} ` + err);
        }
    }

    getDependentItemsPath() {
        let locator = XPATH.container + lib.DEPENDANTS.DEPENDANT_ITEM_LIST_UNPUBLISH_DIALOG + lib.H6_DISPLAY_NAME;
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

