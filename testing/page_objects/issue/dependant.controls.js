/**
 * Created  on 21.07.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('./../../libs/elements');

const xpath = {
    dependantsControlDiv: "//div[contains(@class,'dependants-controls')]",
    dependentItemDiv: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
};

class DependantsControls extends Page {

    constructor(container) {
        super();
        this.container = container;
    }

    get applySelectionButton() {
        return this.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Apply');
    }

    get cancelSelectionButton() {
        return this.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Cancel');
    }

    get showExcludedItemsButton() {
        return this.container + lib.DEPENDANTS.DEPENDANTS_BLOCK + lib.togglerButton('Show excluded');
    }

    get hideExcludedItemsButton() {
        return this.container + lib.DEPENDANTS.DEPENDANTS_BLOCK + lib.togglerButton('Hide excluded');
    }

    get dependantsBlock() {
        return this.container + lib.DEPENDANTS.DEPENDANTS_BLOCK;
    }

    get allDependantsCheckbox() {
        return this.container + xpath.dependantsControlDiv + lib.checkBoxDiv('All');
    }

    waitForAllDependantsCheckboxDisplayed() {
        return this.waitForElementDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    waitForAllDependantsCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    async clickOnAllDependantsCheckbox() {
        await this.waitForAllDependantsCheckboxDisplayed();
        await this.clickOnElement(this.allDependantsCheckbox + "//label[contains(.,'All')]");
    }

    async isAllDependantsCheckboxSelected() {
        // 1. div-checkbox should be displayed:
        await this.waitForAllDependantsCheckboxDisplayed();
        // 2. Check the input:
        return await this.isSelected(this.allDependantsCheckbox + lib.CHECKBOX_INPUT);
    }

    async waitForAllDependantsCheckboxDisabled() {
        let selector = this.allDependantsCheckbox;
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(selector, 'class');
            return text.includes('disabled');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "'All' checkbox should be disabled"});
    }

    async waitForAllDependantsCheckboxEnabled() {
        let selector = this.allDependantsCheckbox;
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(selector, 'class');
            return !text.includes('disabled');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "'All' checkbox should be enabled"});
    }


    async getNumberInAllCheckbox() {
        let locator = this.allDependantsCheckbox + '//label';
        return await this.getText(locator);
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Dependants block is not displayed', 'err_dependencies_block', err);
        }
    }

    async waitForApplySelectionButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.applySelectionButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Dependants block - Apply selection button is not displayed', 'err_apply_btn', err);
        }
    }

    async clickOnApplySelectionButton() {
        await this.waitForApplySelectionButtonDisplayed();
        await this.clickOnElement(this.applySelectionButton);
        return await this.pause(1100);
    }

    async waitForCancelSelectionButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelSelectionButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_cancel_btn');
            throw new Error(`Cancel selection button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForApplySelectionButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.cancelSelectionButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error(`Apply selection button should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnCancelSelectionButton() {
        await this.waitForCancelSelectionButtonDisplayed();
        await this.clickOnElement(this.cancelSelectionButton);
        return await this.pause(500);
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_should_be_hidden');
            throw new Error(`Dependants block, 'Show excluded items' button should not be visible! screenshot: ${screenshot} ` + err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error(`Dependants block, 'Show excluded button' should be visible! screenshot: ${screenshot} ` + +err)
        }
    }

    async clickOnShowExcludedItemsButton() {
        try {
            await this.waitForShowExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.showExcludedItemsButton);
            await this.pause(900);
        } catch (err) {
            await this.handleError('Dependants block, Error during clicking on Show Excluded button', 'err_show_excluded_btn', err);
        }
    }

    async clickOnHideExcludedItemsButton() {
        try {
            await this.waitForHideExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.hideExcludedItemsButton);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Dependants block, tried to click on Hide Excluded button', 'err_hide_excluded_btn', err);
        }
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Dependants block, Hide Excluded Items button should be displayed', 'err_hide_excluded_btn', err);
        }
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Dependants block, Hide Excluded Items button should be hidden', 'err_hide_excluded_btn', err);
        }
    }

    async getDisplayNameInDependentItems() {
        let locator = this.container + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER + lib.H6_DISPLAY_NAME;
        return await this.getTextInDisplayedElements(locator);
    }

    async isDependantCheckboxSelected(displayName) {
        try {
            let checkBoxInputLocator = this.container + xpath.dependentItemDiv(displayName) + lib.CHECKBOX_INPUT;
            return await this.isSelected(checkBoxInputLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_checkbox_selected');
            throw new Error(`Dependants block, is checkbox selected, screenshot: ${screenshot} ` + err)
        }
    }

    async clickOnCheckboxInDependentItem(displayName) {
        let selector = xpath.dependentItemDiv(displayName) + lib.DIV.CHECKBOX_DIV;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        await this.clickOnElement(selector);
        return await this.pause(400);
    }

    async clickOnDependantItemAndSwitchToWizard(displayName) {
        await this.clickOnCheckboxInDependentItem(displayName);
        return await this.getBrowser().switchWindow(displayName);
    }

    async isDependantCheckboxEnabled(displayName) {
        let checkBoxInputLocator = this.container + xpath.dependentItemDiv(displayName) + lib.CHECKBOX_INPUT;
        await this.waitForElementDisplayed(this.container + xpath.dependentItemDiv(displayName), appConst.mediumTimeout);
        return await this.isElementEnabled(checkBoxInputLocator);
    }
}

module.exports = DependantsControls;

