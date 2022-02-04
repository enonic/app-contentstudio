const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentUnpublishDialog')]`,
    dialogHeader: "//div[contains(@id,'ModalDialogHeader')]//h2[@class='title']",
    dialogSubheader: "//div[contains(@id,'ModalDialogHeader')]//h6[@class='sub-title']",
    unpublishButton: "//button[contains(@id,'DialogButton') and descendant::span[contains(.,'Unpublish')]]",
    cancelButtonBottom: "//button[contains(@class,'cancel-button-bottom')]",
    dependantsDiv: "//div[@class='dependants']",
    showDependentItemsLink: "//h6[@class='dependants-header' and contains(.,'Show dependent items')]",
    hideDependentItemsLink: "//h6[@class='dependants-header' and contains(.,'Hide dependent items')]",
    dialogItemListUl: "//ul[contains(@id,'DialogItemList')]",
    dialogDependantListUl: "//ul[contains(@id,'DialogDependantList')]",
    itemBlock: displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,
};

class ContentUnpublishDialog extends Page {

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

    get showDependentItemsLink() {
        return XPATH.container + XPATH.dependantsDiv + XPATH.showDependentItemsLink;
    }

    get hideDependentItemsLink() {
        return XPATH.container + XPATH.dependantsDiv + XPATH.hideDependentItemsLink;
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

    waitForShowDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.mediumTimeout);
    }

    waitForHideDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.mediumTimeout);
    }

    async clickOnShowDependentItemsLink() {
        await this.waitForShowDependentItemsLinkDisplayed();
        return await this.clickOnElement(this.showDependentItemsLink);
    }

    async clickOnHideDependentItemsLink() {
        await this.waitForHideDependentItemsLinkDisplayed();
        return await this.clickOnElement(this.hideDependentItemsLink);
    }

    waitForHideDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.mediumTimeout);
    }

    getItemDisplayName() {
        let locator = XPATH.container + XPATH.dialogItemListUl + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }

    getDependentItemsPath() {
        let locator = XPATH.container + XPATH.dialogDependantListUl + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }

    getDialogHeader() {
        return this.getText(this.header);
    }

    getDialogSubheader() {
        return this.getText(this.subheader);
    }

    async getNumberInUnpublishButton() {
        let locator = XPATH.container + XPATH.unpublishButton + "//span";
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
}

module.exports = ContentUnpublishDialog;

