const Page = require('./page');
const appConst = require('../libs/app_const');
const {BUTTONS} = require('../libs/elements');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='DuplicateDialogMainContent']`,
    listItemByDisplayName: displayName => `//div[@role='listitem' and (descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]])]`,
    mainListItemsDisplayName:`//div[@role='separator']/preceding::div[@role='listitem'][ancestor::div[@role='dialog' and @data-component='DuplicateDialogMainContent']]//div[@data-component='ContentLabel']//span[following-sibling::small]`,
    dependantListItemDisplayName:`//div[@role='separator']/following::div[@role='listitem'][ancestor::div[@role='dialog' and @data-component='DuplicateDialogMainContent']]//div[@data-component='ContentLabel']//span[not(*)]`,
    includeChildCheckboxByDisplayName: displayName => XPATH.listItemByDisplayName(displayName) + "/following-sibling::div//label",
    dependantsHeader: "//div[@role='separator']/span",
    separatorDiv:"//div[@role='separator']",
};

class ContentDuplicateDialog extends Page {

    get dependentsHeader() {
        return XPATH.container + XPATH.dependantsHeader;
    }

    get duplicateButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Duplicate');
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    async waitForDuplicateButtonDisplayed() {
        await this.waitForElementDisplayed(this.duplicateButton, appConst.mediumTimeout);
    }
    async waitForDuplicateButtonEnabled(){
        await this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
    }

    async waitForIncludeChildCheckboxDisplayed(displayName) {
        let locator = XPATH.container + XPATH.includeChildCheckboxByDisplayName(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async waitForCloseButtonDisplayed() {
        return await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
    }

    async clickOnIncludeChildCheckbox(displayName) {
        try {
            let locator = XPATH.container + XPATH.includeChildCheckboxByDisplayName(displayName);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_child_toggle', err);
        }
    }

    async clickOnDuplicateButton() {
        try {
            await this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
            await this.clickOnElement(this.duplicateButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_btn', err);
        }
    }

    waitForDependantsHeaderDisplayed() {
        return this.waitForElementDisplayed(this.dependentsHeader, appConst.mediumTimeout);
    }

    async getDependantsHeader() {
        await this.waitForDependantsHeaderDisplayed();
        return await this.getText(this.dependentsHeader);
    }

    async waitForDependantsHeaderNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.dependentsHeader);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            await this.pause(200);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_close', err);
        }
    }

    //gets number in `Duplicate` button, It is total number of items to duplicate
    async getNumberItemsInDuplicateButton() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getText(this.duplicateButton);
                return text.includes('(');
            }, {timeout: appConst.mediumTimeout});
            let result = await this.getText(this.duplicateButton);
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_btn_number', err);
        }
    }

    async getMainItemsDisplayName() {
        try {
            let selector = XPATH.container + XPATH.mainListItemsDisplayName;
            return await this.getTextInElements(selector);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_display_names', err);
        }
    }

    async getDependentsName() {
        try {
            let locator = XPATH.container + XPATH.dependantListItemDisplayName;
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_dependents_name', err);
        }
    }
}

module.exports = ContentDuplicateDialog;
