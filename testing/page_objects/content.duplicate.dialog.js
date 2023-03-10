const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentDuplicateDialog')]`,
    duplicateButton: `//button/span[contains(.,'Duplicate')]`,
    cancelButton: `//button/span[text()='Cancel']`,
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
        return `${XPATH.container}` + `${XPATH.duplicateButton}`;
    }

    get includeChildToggler() {
        return XPATH.container + XPATH.includeChildToggler;
    }

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
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
        await this.clickOnElement(this.includeChildToggler);
        return await this.pause(1000);
    }

    async clickOnDuplicateButton() {
        try {
            await this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
            await this.clickOnElement(this.duplicateButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_duplicate_btn');
            await this.saveScreenshot(screenshot);
            throw new Error('Error after clicking on Duplicate button, screenshot:  ' + screenshot + ' ' + err);
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

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("'Content Duplicate' dialog is not loaded " + err);
        })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("'Content Duplicate' dialog must be closed  " + err);
        })
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
            throw new Error("Error when getting number in 'Duplicate' button " + err);
        }
    }

    getDisplayNamesToDuplicate() {
        let selector = XPATH.container + `//ul[contains(@id,'DialogTogglableItemList')]` + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector).then(result => {
            return result;
        }).catch(err => {
            throw new Error('Duplicate Dialog: error when getting display names : ' + err)
        })
    }

    async getDependentsName() {
        try {
            let locator = XPATH.container + lib.DEPENDANTS.DEPENDENT_ITEM_LIST_UL + lib.H6_DISPLAY_NAME;
            return await this.getTextInElements(locator);
        } catch (err) {
            throw new Error('Duplicate Dialog: error when getting dependents name : ' + err)
        }
    }

    waitForAllCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }
}

module.exports = ContentDuplicateDialog;
