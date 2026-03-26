const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const ContentSelectorDropdown = require('../../components/selectors/content.selector.dropdown');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='HtmlAreaLinkDialog']`,
    contentPanel: "//div[@data-component='ContentTabPanel']",
    checkboxByLabel: label => `//button[@role='checkbox' and following-sibling::*[contains(.,'${label}')] or preceding-sibling::*[contains(.,'${label}')]]`,
    radioButtonByLabel: label => `//button[@role='radio' and contains(.,'${label}')]`,
};

class InsertLinkDialogContentPanel extends Page {

    get showContentFromEntireProjectCheckbox() {
        return XPATH.container + XPATH.contentPanel + XPATH.checkboxByLabel('Show content from the entire');
    }

    get openInNewTabCheckbox() {
        return XPATH.container + XPATH.contentPanel + XPATH.checkboxByLabel('Open in a new tab');
    }

    get addAnchorButton() {
        return XPATH.container + XPATH.contentPanel + "//span[contains(.,'Fragment')]/following-sibling::button | " +
            XPATH.container + XPATH.contentPanel + "//span[contains(.,'Fragment')]/..//button[contains(.,'Add')]";
    }

    get anchorTextInput() {
        return XPATH.container + XPATH.contentPanel + "//span[contains(.,'Fragment')]/../following-sibling::div//input";
    }

    get addParametersButton() {
        return XPATH.container + XPATH.contentPanel + "//span[contains(.,'Parameters')]/..//button[contains(.,'Add')]";
    }

    get contentSelectorInput() {
        return XPATH.container + XPATH.contentPanel + "//div[@data-component='ContentSelector']//input";
    }

    async typeTextInContentOptionsFilterInput(text) {
        try {
            await this.waitForElementDisplayed(this.contentSelectorInput, appConst.mediumTimeout);
            await this.typeTextInInput(this.contentSelectorInput, text);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_filter_input');
            throw new Error(`Error occurred in Insert Link modal dialog! screenshot:${screenshot} ` + err);
        }
    }

    waitForShowContentFromEntireProjectCheckboxDisplayed() {
        return this.waitForElementDisplayed(this.showContentFromEntireProjectCheckbox, appConst.mediumTimeout);
    }

    async waitForOpenInNewTabCheckboxDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.openInNewTabCheckbox, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Open In New Tab' checkbox should be displayed!`, 'err_open_in_new_tab_checkbox', err);
        }
    }

    async isShowContentFromEntireProjectCheckboxSelected() {
        let attr = await this.getAttribute(this.showContentFromEntireProjectCheckbox, 'data-state');
        return attr === 'checked';
    }

    async isOpenInNewTabCheckboxSelected() {
        let attr = await this.getAttribute(this.openInNewTabCheckbox, 'data-state');
        return attr === 'checked';
    }

    async waitForShowContentFromEntireProjectCheckboxNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.showContentFromEntireProjectCheckbox, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_checkbox');
            throw new Error(`Show Content From Entire Project Checkbox should not be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnShowContentFromEntireProjectCheckbox() {
        await this.waitForElementDisplayed(this.showContentFromEntireProjectCheckbox, appConst.mediumTimeout);
        await this.clickOnElement(this.showContentFromEntireProjectCheckbox);
    }

    async clickOnOpenInNewTabCheckbox() {
        await this.waitForElementDisplayed(this.openInNewTabCheckbox, appConst.mediumTimeout);
        await this.clickOnElement(this.openInNewTabCheckbox);
    }

    async waitForAddParametersButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.addParametersButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_param_btn');
            throw new Error(`Add parameters button should be displayed! screenshot:${screenshot} ` + err);
        }
    }

    async waitForAddAnchorButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.addAnchorButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_anchor_btn');
            throw new Error(`Add Anchor button should be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async waitForAddAnchorButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.addAnchorButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_anchor_btn');
            throw new Error(`Add Anchor button should not be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async selectTargetInContentSelector(targetDisplayName) {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.selectFilteredByDisplayNameContent(targetDisplayName, XPATH.container);
    }

    async typeTextInFilterInputInContentSelector(targetDisplayName) {
        let contentSelector = new ContentSelectorDropdown();
        await contentSelector.filterItem(targetDisplayName, XPATH.container);
        await this.pause(600);
    }

    async clickOnApplySelectionButton() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.clickOnApplySelectionButton(XPATH.container);
    }

    async clickOnOptionByDisplayName(optionDisplayName) {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.clickOnOptionByDisplayName(optionDisplayName, XPATH.container);
    }

    // Click on a radio in Media options:
    async clickOnRadioButton(label) {
        let locator = XPATH.container + XPATH.contentPanel + XPATH.radioButtonByLabel(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async clickOnAddAnchorButton() {
        await this.waitForAddAnchorButtonDisplayed();
        return await this.clickOnElement(this.addAnchorButton);
    }

    async clickOnAddParametersButton() {
        await this.waitForAddParametersButtonDisplayed();
        return await this.clickOnElement(this.addParametersButton);
    }

    async getTextInAnchorInput() {
        await this.waitForElementDisplayed(this.anchorTextInput, appConst.mediumTimeout);
        return await this.getTextInInput(this.anchorTextInput);
    }

    async typeTextInAnchorInput(text) {
        await this.waitForElementDisplayed(this.anchorTextInput, appConst.mediumTimeout);
        return await this.typeTextInInput(this.anchorTextInput, text);
    }

    async typeInParameterNameInput(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let locator = XPATH.container + XPATH.contentPanel + "//input[@placeholder='Name' or contains(@placeholder,'name')]";
        let inputElements = await this.getDisplayedElements(locator);
        if (inputElements.length === 0) {
            throw new Error('Parameter name input was not found in the Insert Link modal dialog');
        }
        await inputElements[index].setValue(value);
        return await this.pause(300);
    }

    async getTextInParameterNameInput(index) {
        index = typeof index !== 'undefined' ? index : 0;
        let locator = XPATH.container + XPATH.contentPanel + "//input[@placeholder='Name' or contains(@placeholder,'name')]";
        let inputElements = await this.getDisplayedElements(locator);
        return await inputElements[index].getValue();
    }

    async typeInParameterValueInput(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let locator = XPATH.container + XPATH.contentPanel + "//input[@placeholder='Value' or contains(@placeholder,'value')]";
        let inputElements = await this.getDisplayedElements(locator);
        await inputElements[index].setValue(value);
        return await this.pause(300);
    }

    waitForUploadContentButtonDisplayed() {
        let locator = XPATH.container + XPATH.contentPanel + "//button[descendant::*[contains(@class,'lucide-upload')]]";
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = InsertLinkDialogContentPanel;
