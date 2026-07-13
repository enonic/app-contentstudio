/**
 * Created  on 21.07.2023 updated on 09.07.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {COMMON, DIALOG_ITEMS, SELECTION_STATUS_BAR} = require('./../../libs/elements');

class DependantsControls extends Page {

    constructor(container) {
        super();
        this.container = container;
    }

    get applySelectionButton() {
        return this.container + SELECTION_STATUS_BAR.BUTTON_APPLY;
    }

    get cancelSelectionButton() {
        return this.container + SELECTION_STATUS_BAR.BUTTON_CANCEL;
    }

    get showExcludedItemsButton() {
        return this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + COMMON.togglerButton('Show excluded');
    }

    get hideExcludedItemsButton() {
        return this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + COMMON.togglerButton('Hide excluded');
    }

    get dependantsBlock() {
        return this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV;
    }

    get allDependantsCheckboxLabel() {
        return this.container + DIALOG_ITEMS.DEPENDANTS_SELECT_ALL_LABEL;
    }

    get allDependantsCheckboxInput() {
        return this.container + DIALOG_ITEMS.DEPENDANTS_SELECT_ALL_INPUT;
    }

    waitForAllDependantsCheckboxDisplayed() {
        return this.waitForElementDisplayed(this.allDependantsCheckboxLabel, appConst.mediumTimeout);
    }

    waitForAllDependantsCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckboxLabel, appConst.mediumTimeout);
    }

    async clickOnAllDependantsCheckbox() {
        await this.waitForAllDependantsCheckboxDisplayed();
        await this.clickOnElement(this.allDependantsCheckboxLabel);
    }

    async isAllDependantsCheckboxSelected() {
        await this.waitForAllDependantsCheckboxDisplayed();
        return await this.isSelected(this.allDependantsCheckboxInput);
    }

    async waitForAllDependantsCheckboxDisabled() {
        let selector = this.allDependantsCheckboxInput;
        await this.getBrowser().waitUntil(async () => {
            let ariaDisabled = await this.getAttribute(selector, 'aria-disabled');
            return ariaDisabled === 'true';
        }, {timeout: appConst.shortTimeout, timeoutMsg: "'All' checkbox should be disabled"});
    }

    async waitForAllDependantsCheckboxEnabled() {
        let selector = this.allDependantsCheckboxInput;
        await this.getBrowser().waitUntil(async () => {
            let ariaDisabled = await this.getAttribute(selector, 'aria-disabled');
            return ariaDisabled === 'false';
        }, {timeout: appConst.shortTimeout, timeoutMsg: "'All' checkbox should be enabled"});
    }

    async getNumberInAllCheckbox() {
        return await this.getText(this.allDependantsCheckboxLabel);
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Dependants block is not displayed', 'err_dependencies_block', err);
        }
    }

    async waitForDependantsBlockNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Dependants block should not be displayed', 'err_dependencies_block', err);
        }
    }

    async waitForApplySelectionButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.applySelectionButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error(`Dependants block - 'Apply selection' button is not displayed, screenshot: ${screenshot} ` + err);
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
            return await this.waitForElementNotDisplayed(this.applySelectionButton, appConst.mediumTimeout);
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
            return await this.waitForElementNotDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Dependants block, 'Show excluded items' button should not be visible!`, `err_show_excluded`, err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Dependants block, 'Show excluded items' button should be visible!`, `err_show_excluded_btn`, err);
        }
    }

    async clickOnShowExcludedItemsButton() {
        try {
            await this.waitForShowExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.showExcludedItemsButton);
            await this.pause(900);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error('Dependants block, Error during clicking on Show Excluded button, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async clickOnHideExcludedItemsButton() {
        try {
            await this.waitForHideExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.hideExcludedItemsButton);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Dependants block, Error during clicking on Hide Excluded button`, `err_hide_excluded_btn`, err);
        }
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Dependants block, 'Hide excluded items' button should be displayed!`, `err_hide_excluded_btn`, err);
        }
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Dependants block, 'Hide excluded items' button should be hidden!`, `err_hide_excluded_btn`, err);
        }
    }

    async getDisplayNameInDependentItems() {
        let locator = this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + DIALOG_ITEMS.CONTENT_ROW + DIALOG_ITEMS.ITEMS_NAME_SPAN;
        await this.waitForElementDisplayed(locator);
        return await this.getTextInDisplayedElements(locator);
    }

    async isDependantCheckboxSelected(name) {
        try {

            let checkBoxInputLocator = this.container + DIALOG_ITEMS.contentCheckboxInputByName(name);
            await this.waitForElementDisplayed(this.container + DIALOG_ITEMS.contentCheckboxLabelByName(name));
            return await this.isSelected(checkBoxInputLocator);
        } catch (err) {
            await this.handleError(`Dependants block, is checkbox selected for item ${name}`, `err_checkbox_selected`, err);
        }
    }

    async clickOnCheckboxInDependentItem(displayName) {
        let selector = this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + DIALOG_ITEMS.contentCheckboxLabelByName(displayName);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        await this.clickOnElement(selector);
        return await this.pause(400);
    }

    async clickOnDependantItemAndSwitchToWizard(displayName) {
        await this.clickOnCheckboxInDependentItem(displayName);
        return await this.getBrowser().switchWindow(displayName);
    }

    async isDependantCheckboxEnabled(name) {
        try {
            let checkBoxLabelLocator = this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV +
                                       DIALOG_ITEMS.contentCheckboxLabelByName(name);
            let checkBoxInputLocator = this.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV +
                                       DIALOG_ITEMS.contentCheckboxInputByName(name);
            await this.waitForElementDisplayed(checkBoxLabelLocator, appConst.mediumTimeout);
            let ariaDisabled = await this.getAttribute(checkBoxInputLocator, 'aria-disabled');
            return ariaDisabled !== 'true';
        } catch (err) {
            await this.handleError(`Dependants block, is checkbox enabled for item ${name}`, 'err_checkbox_enabled', err);
        }
    }
}

module.exports = DependantsControls;

