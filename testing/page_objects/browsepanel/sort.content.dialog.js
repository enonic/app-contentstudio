const Page = require('../page');
const appConst = require('../../libs/app_const');
const {BUTTONS, DROPDOWN} = require('../../libs/elements');
const XPATH = {
    container: `//div[@data-component='Dialog.Content' and descendant::h2[text()='Sort items']]`,
    sortElementSelector: "//div[@data-component='SortElementSelector']",
    sortElementSelectedValue: "//span[@data-component='Selector.Value']",
    cancelButton: "//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]",
    menuButton: "//div[contains(@id,'SortContentTabMenu')]//div[contains(@id,'TabMenuButton')]",
    sortMenuItem:
        by => `//li[contains(@id,'SortContentTabMenuItem') and child::a[text()='${by}']]`,
    contentListItemDisplayName: "//div[@data-component='SortContentListItem']//span[contains(@class,'font-semibold')]",
    contentListItemByName:
        name => `//div[@data-component='SortContentListItem' and descendant::span[contains(@class,'font-semibold') and text()='${name}']]`,
    // Sort-element dropdown options are rendered in a portal (Selector.Content), outside the dialog container:
    sortElementOption: "//div[@data-component='Selector.Content']//span[@data-component='Selector.ItemText']",
    sortElementOptionByText:
        option => `//div[@data-component='Selector.Content']//div[@data-component='Selector.Item' and descendant::span[@data-component='Selector.ItemText' and text()='${option}']]`,
};

class SortContentDialog extends Page {

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get saveButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Save');
    }

    get dropdownHandle() {
        return XPATH.container + XPATH.sortElementSelector + DROPDOWN.SELECTOR_ICON;
    }

    async clickOnSaveButton() {
        try {
            await this.waitForSaveButtonEnabled();
            await this.clickOnElement(this.saveButton);
            await this.waitForSpinnerNotVisible();
            await this.waitForDialogClosed();
            return await this.pause(1200);
        } catch (err) {
            await this.handleError('Sort Content Dialog, error on clicking Save button: ', 'err_click_sort_save_button', err);
        }
    }

    waitForDialogVisible() {
        return this.waitForElementDisplayed(this.saveButton, appConst.shortTimeout);
    }

    waitForSaveButtonDisabled() {
        return this.waitForElementDisabled(this.saveButton, appConst.shortTimeout);
    }

    waitForSaveButtonEnabled() {
        return this.waitForElementEnabled(this.saveButton, appConst.shortTimeout);
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.longTimeout)
        } catch (err) {
            await this.handleError('Sort Content Dialog, error on waiting for dialog closed: ', 'err_wait_for_sort_dialog_closed', err);
        }
    }

    clickOnCloseButton() {
        return this.clickOnElement(this.closeButton);
    }

    //expand menu-options('Modified date', 'Display name'...)
    async clickOnMenuButton() {
        //await this.waitForElementDisplayed(this.menuButton,appConst.TIMEOUT_4);
        await this.clickOnElement(this.menuButton);
        return await this.pause(500);
    }

    async selectSortMenuItem(by, order) {
        let menuItemXpath = XPATH.container + XPATH.sortMenuItem(by);
        let fullSelector;
        if (order === 'ascending') {
            fullSelector = menuItemXpath + "//button[@title='Sort in ascending order']"
        } else if (order === 'descending') {
            fullSelector = menuItemXpath + "//button[@title='Sort in descending order']"
        } else {
            fullSelector = menuItemXpath;
        }
        await this.clickOnElement(fullSelector);
        return await this.pause(300);
    }

    async getMenuItems() {
        let locator = XPATH.sortElementOption;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getSelectedOrder() {
        let selector = XPATH.container + XPATH.sortElementSelector + XPATH.sortElementSelectedValue;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.getText(selector);
    }

    async swapItems(sourceContentName, destinationContentName) {
        let sourceLocator = XPATH.container + XPATH.contentListItemByName(sourceContentName);
        let destLocator = XPATH.container + XPATH.contentListItemByName(destinationContentName);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    getDialogTitle() {
        let locator = XPATH.container + "//h2[@data-component='Dialog.Title']";
        return this.getText(locator);
    }

    async clickOndropDownHandle() {
        await this.waitForElementDisplayed(this.dropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.dropdownHandle);
        await this.pause(700);
        return await this.waitForSpinnerNotVisible();
    }

    async clickOnSortItemOption(option) {
        let locator = XPATH.sortElementOptionByText(option);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    getContentNamesInTreeGrid() {
        let locator = XPATH.container + XPATH.contentListItemDisplayName;
        return this.getTextInDisplayedElements(locator);
    }
}

module.exports = SortContentDialog;

