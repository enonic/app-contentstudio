const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'SortContentDialog')]`,
    saveButton: "//button[contains(@id,'DialogButton') and child::span[text()='Save']]",
    cancelButton: "//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]",
    menuButton: "//div[contains(@id,'SortContentTabMenu')]//div[contains(@id,'TabMenuButton')]",
    sortMenuItem:
        by => `//li[contains(@id,'SortContentTabMenuItem') and child::a[text()='${by}']]`,
};

class SortContentDialog extends Page {

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get saveButton() {
        return XPATH.container + XPATH.saveButton;
    }

    get dropdownHandle() {
        return XPATH.container + "//div[contains(@id,'SortContentTabMenu')]" + lib.DROP_DOWN_HANDLE;
    }

    get menuButton() {
        return XPATH.container + XPATH.menuButton;
    }

    async clickOnSaveButton() {
        try {
            await this.waitForSaveButtonEnabled();
            await this.clickOnElement(this.saveButton);
            await this.waitForSpinnerNotVisible();
            await this.waitForDialogClosed();
            return await this.pause(1200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_sort_save_button');
            throw new Error(`Error occurred in Sort Content dialog, screenshot: ${screenshot} ` + err);
        }
    }

    waitForDialogVisible() {
        return this.waitForElementDisplayed(XPATH.saveButton, appConst.shortTimeout);
    }

    waitForSaveButtonDisabled() {
        return this.waitForElementDisabled(XPATH.saveButton, appConst.shortTimeout);
    }

    waitForSaveButtonEnabled() {
        return this.waitForElementEnabled(XPATH.saveButton, appConst.shortTimeout);
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.longTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_close_sort_dialog');
            throw new Error(`Sort content dialog must be closed, screenshot: ${screenshot} ` + err);
        }
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
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
        let locator = XPATH.container + "//li[contains(@id,'SortContentTabMenuItem')]//a";
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getSelectedOrder() {
        let selector = XPATH.container + XPATH.menuButton + "//a";
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.getAttribute(selector, 'title');
    }

    async swapItems(sourceContentName, destinationContentName) {
        let sourceLocator = lib.TREE_GRID.itemByName(sourceContentName);
        let destLocator = lib.TREE_GRID.itemByName(destinationContentName);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    getDialogTitle() {
        let locator = XPATH.container + "//h2[@class='title']";
        return this.getText(locator);
    }

    async clickOndropDownHandle() {
        await this.waitForElementDisplayed(this.dropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.dropdownHandle);
        await this.pause(700);
        return await this.waitForSpinnerNotVisible();
    }

    async doSort(by, order) {
        let menuItem = XPATH.container + `//li[contains(@id,'SortContentTabMenuItem') and child::a[text()='${by}']]`;
        let locator;
        if (order === appConst.SORT_DIALOG.ASCENDING) {
            locator = menuItem + "//button[contains(@class,'asc')]";
        } else {
            locator = menuItem + "//button[contains(@class,'desc')]";
        }
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    getContentNamesInTreeGrid() {
        let locator = XPATH.container + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }
}

module.exports = SortContentDialog;

