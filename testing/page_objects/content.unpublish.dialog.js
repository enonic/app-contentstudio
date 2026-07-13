const Page = require('./page');
const appConst = require('../libs/app_const');
const {BUTTONS} = require('../libs/elements');
const DiffStatusBadge = require('./components/diff.status.badge');

const XPATH = {
    container: `//div[@data-component='UnpublishDialogMainContent']`,
    dialogHeader: "//h2[contains(.,'Unpublish item')]",
    mainListItemsDisplayName: `//div[@role='separator']/preceding::div[@data-component='ContentListItemWithReference']//div[@data-component='ContentLabel']//span[following-sibling::small]`,
    dependantListItemPath: `//div[@role='separator']/following::div[@data-component='ContentListItemWithReference']//div[@data-component='ContentLabel']//span[contains(@class,'font-semibold')]`,
    showReferencesButton: displayName =>
        `//div[@data-component='ContentListItemWithReference' and descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]]]//a[@data-component='ContentReferencesLink' and contains(.,'Show references')]`,
    mainItemByName: name =>
        `//div[@role='separator']/preceding::div[@data-component='ContentListItemWithReference' and descendant::div[@data-component='ContentLabel']//span[contains(.,'${name}')]]`,
    dependentItemByName: name =>
        `//div[@role='separator']/following::div[@data-component='ContentListItemWithReference' and descendant::div[@data-component='ContentLabel']//span[contains(.,'${name}')]]`,
};

class ContentUnpublishDialog extends Page {

    get dependantsBlock() {
        return XPATH.container + "//div[@data-component='ContentListItemWithReference']"
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get header() {
        return XPATH.container + XPATH.dialogHeader;
    }

    get unpublishButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Unpublish');
    }

    get ignoreInboundReferencesButton() {
        return XPATH.container + "//button[@data-component='StatusBarEntryButton' and contains(.,'Ignore inbound references')]";
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.unpublishButton);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container);
    }

    async waitForUnpublishButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.unpublishButton);
        } catch (err) {
            await this.handleError('Content Unpublish Dialog', 'err_unpublish_btn_enabled', err);
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
        return this.waitForElementDisplayed(this.ignoreInboundReferencesButton);
    }

    waitForIgnoreInboundReferencesButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.ignoreInboundReferencesButton);
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

    async getMainItemDisplayName() {
        try {
            let locator = XPATH.container + XPATH.mainListItemsDisplayName;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            await this.handleError('Content Unpublish Dialog', 'err_get_main_items', err);
        }
    }

    async getDependentItemsPath() {
        let locator = XPATH.container + XPATH.dependantListItemPath;
        return await this.getTextInDisplayedElements(locator);
    }

    getDependentItemsName() {
        let locator = XPATH.container + XPATH.dependantListItemPath;
        return this.getTextInDisplayedElements(locator);
    }

    getDialogHeader() {
        return this.getText(this.header);
    }

    async getNumberInUnpublishButton() {
        let label = await this.getText(this.unpublishButton);
        let startIndex = label.indexOf('(');
        if (startIndex === -1) {
            return '';
        }
        let endIndex = label.indexOf(')');
        return label.substring(startIndex + 1, endIndex);
    }

    async getMainItemStatus(displayName) {
        const rowXpath = XPATH.container + XPATH.mainItemByName(displayName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getStatusText();
    }

    async getDependentItemStatus(displayName) {
        const rowXpath = XPATH.container + XPATH.dependentItemByName(displayName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getStatusText();
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock);
        } catch (err) {
            await this.handleError('Content Unpublish Dialog', 'err_dependences_block', err);
        }
    }
}

module.exports = ContentUnpublishDialog;

