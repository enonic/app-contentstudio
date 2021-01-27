const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentDuplicateDialog')]`,
    duplicateButton: `//button/span[contains(.,'Duplicate')]`,
    cancelButton: `//button/span[text()='Cancel']`,
    includeChildToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    showDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    hideDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Hide dependent items')]`,
};

class ContentDuplicateDialog extends Page {

    get showDependentItemsLink() {
        return XPATH.container + XPATH.showDependentItemsLink;
    }

    get hideDependentItemsLink() {
        return XPATH.container + XPATH.hideDependentItemsLink;
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

    isShowDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.shortTimeout).catch(err => {
            return false;
        })
    }

    waitForHideDependentItemLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.shortTimeout).catch((err) => {
            this.saveScreenshot('err_load_hide_dependent_link');
            throw new Error('Hide Dependent link must be loaded ' + err);
        })
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
        await this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
        await this.clickOnElement(this.duplicateButton);
        return await this.pause(500);
    }

    async clickOnShowDependentItemLink() {
        await this.waitForElementEnabled(this.showDependentItemsLink, appConst.shortTimeout);
        await this.clickOnElement(this.showDependentItemsLink);
        return await this.pause(500);
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("Content Duplicate dialog is not loaded " + err);
        })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("Content Duplicate dialog must be closed  " + err);
        })
    }

    async getNumberInDependentItemsLink() {
        try {
            let linkText = await this.getText(this.showDependentItemsLink);
            let startIndex = linkText.indexOf('(');
            if (startIndex == -1) {
                throw new Error("Content Duplicate Dialog - error when get a number in  `show dependent items` link  ");
            }
            let endIndex = linkText.indexOf(')');
            if (endIndex == -1) {
                throw new Error("Content Duplicate Dialog - error when get a number in  `show dependent items` link  ");
            }
            return linkText.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error(err);
        }
    }

    //gets number in `Duplicate` button, It is total number of items to duplicate
    async getTotalNumberItemsToDuplicate() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getText(this.duplicateButton);
                return text.includes('(');
            }, appConst.mediumTimeout);
            let result = await this.getText(this.duplicateButton);
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Error when getting number in Duplicate button " + err);
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

    getDependentsName() {
        let selector = XPATH.container + `//ul[contains(@id,'DialogDependantList')]` + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector).then(result => {
            return result;
        }).catch(err => {
            throw new Error('Duplicate Dialog: error when getting dependents name : ' + err)
        })
    }
};
module.exports = ContentDuplicateDialog;
