const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentDuplicateDialog')]`,
    includeChildToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    dependantsHeader: "//div[@class='dependants-header']/span[@class='dependants-title']",
};

class ContentDuplicateDialog extends Page {

    get dependentsHeader() {
        return XPATH.container + XPATH.dependantsHeader;
    }

    get allDependantsCheckbox() {
        return XPATH.container + lib.checkBoxDiv('All');
    }

    get duplicateButton() {
        return XPATH.container + lib.dialogButton('Duplicate');
    }

    get includeChildToggler() {
        return XPATH.container + XPATH.includeChildToggler;
    }

    get cancelButton() {
        return XPATH.container + lib.dialogButton('Cancel');
    }

    isIncludeChildTogglerDisplayed() {
        return this.isElementDisplayed(this.includeChildToggler);
    }

    isDuplicateButtonDisplayed() {
        return this.isElementDisplayed(this.duplicateButton);
    }

    isCancelButtonDisplayed() {
        return this.isElementDisplayed(this.cancelButton);
    }

    async clickOnIncludeChildToggler() {
        try {
            await this.clickOnElement(this.includeChildToggler);
            return await this.pause(1000);
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
        return await this.getText(XPATH.dependantsHeader);
    }

    async waitForDependantsHeaderNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.dependentsHeader);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            await this.pause(400);
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

    async getDisplayNamesToDuplicate() {
        try {
            let selector = XPATH.container + `//ul[contains(@id,'DialogTogglableItemList')]` + lib.H6_DISPLAY_NAME;
            return await this.getTextInElements(selector);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_display_names', err);
        }
    }

    async getDependentsName() {
        try {
            let locator = XPATH.container + lib.DEPENDANTS.DEPENDENT_ITEM_LIST_UL + lib.H6_DISPLAY_NAME;
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Content Duplicate dialog', 'err_duplicate_dlg_dependents_name', err);
        }
    }

    waitForAllCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }
}

module.exports = ContentDuplicateDialog;
