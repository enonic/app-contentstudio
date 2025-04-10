/**
 * Created on 8.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'InstallAppDialog')]`,
    gridUL: `//ul[contains(@id,'MarketAppsTreeGrid')]`,
    filterInput: `//div[contains(@id,'ApplicationInput')]/input`,
    appByDisplayName(displayName) {
        return `//div[contains(@id,'InstallAppDialog')]//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name')]]//a[contains(.,'${displayName}')]`
    },
    installButtonByName(displayName) {
        return `${lib.MARKET_MODAL_DIALOG.rowByDisplayName(displayName)}//button/span[text()='Install']`
    },
    installedStatusByName(displayName) {
        return `${lib.MARKET_MODAL_DIALOG.rowByDisplayName(displayName)}//button/span[text()='Installed']`;
    }
};

class InstallAppDialog extends Page {

    get searchInput() {
        return XPATH.container + XPATH.filterInput;
    }

    get grid() {
        return XPATH.container + XPATH.gridUL;
    }

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    async waitForAppInstalled(appName) {
        try {
            return await this.waitForElementDisplayed(XPATH.installedStatusByName(appName), appConst.saveProjectTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_inst_status');
            throw new Error(`Install App Dialog - App status for : ${appName} should be 'Installed', screenshot ${screenshot} ` + err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(this.grid, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_load_install_dialog');
            throw new Error(`Install App dialog was not loaded! screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForClosed(ms) {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, ms)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_install_dialog_close');
            await this.clickOnCancelButtonTop();
            throw new Error(`Install Dialog was not closed! screenshot: ${screenshot} ` + err);
        }
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButton).catch(err => {
            this.saveScreenshot('err_install_dialog_cancel_button');
            throw new Error('Error when clicking on cancel button ' + err);
        })
    }

    async waitForGridLoaded() {
        try {
            await this.waitForElementDisplayed(this.grid + lib.H6_DISPLAY_NAME, appConst.longTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_install_dialog_grid');
            throw new Error(`Install App dialog, grid was not loaded! screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForInstallLink(appName) {
        try {
            const selector = XPATH.installButtonByName(appName);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_install_link');
            throw new Error(`Install link is not displayed for the application: ${appName},  screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnInstallAppLink(appName) {
        try {
            let locator = XPATH.installButtonByName(appName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.pause(400);
            return await this.clickOnElement(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_installed_status');
            throw new Error(`Couldn't find install link for the application: ${appName}, screenshot: ${screenshot} ` + err);
        }
    }

    //checks that 'installed' status appeared
    async waitForApplicationInstalled(appName) {
        try {
            let locator = XPATH.installedStatusByName(appName);
            return await this.waitForElementDisplayed(locator, appConst.longTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_installed_status');
            throw new Error(`Couldn't find 'Installed' label for the application: ${appName}, screenshot: ${screenshot} ` + err);
        }
    }

    isCancelButtonTopDisplayed() {
        return this.isElementDisplayed(this.cancelButton).catch(err => {
            throw new Error('Error - Cancel button top is not displayed ' + err);
        })
    }

    async getErrorValidationMessage() {
        try {
            let selector = XPATH.container + `//div[contains(@class,'status-message') and contains(@class,'failed')]`;
            await this.waitForElementDisplayed(selector, appConst.longTimeout);
            return await this.getText(selector);
        } catch (err) {
            let screenshot = this.saveScreenshotUniqueName('err_wait_for_validation_message');
            throw new Error(`Validation message is not visible in 'Install app' dialog,  screenshot: ${screenshot}  ` + err);
        }
    }

    async getApplicationNotFoundMessage() {
        try {
            let selector = XPATH.container + `//div[@class='status-message']`;
            await this.waitForElementDisplayed(selector, appConst.longTimeout);
            return await this.getTextInDisplayedElements(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_app_not_found_message');
            throw new Error(`'Application not found' message should be displayed, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForApplicationNotFoundMessage() {
        try {
            let selector = XPATH.container + `//div[contains(@class,'status-message') and contains(.,'No applications found')]`;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_app_not_found_mess');
            throw new Error(`expected notification message should be displayed! screenshot: ${screenshot}  ` + err);
        }
    }

    getPlaceholderMessage() {
        return this.getAttribute(this.searchInput, 'placeholder');
    }

    getApplicationNames() {
        let items = XPATH.gridUL + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(items);
    }

    async waitForApplicationDisplayed(appDisplayName) {
        try {
            let selector = XPATH.appByDisplayName(appDisplayName);
            return await this.waitForElementDisplayed(selector, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_app_displayed');
            throw new Error(`Application ${appDisplayName} is not displayed in the Install app dialog, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForSearchInputEnabled() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let attrClass = await this.getAttribute(this.searchInput, 'class');
                return !attrClass.includes('disabled');
            }, {timeout: appConst.longTimeout, timeoutMsg: "'Search Input' is not enabled!"});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_search_input');
            throw new Error(`Error - Install App Dialog, search input,  screenshot:${screenshot} ` + err);
        }
    }

    async typeSearchText(text) {
        await this.waitForSearchInputEnabled();
        return await this.typeTextInInput(this.searchInput, text);
    }

    async typeSearchTextAndEnter(text) {
        await this.typeTextInInput(this.searchInput, text);
        await this.pause(700);
        return await this.keys('Enter');
    }

    async clickOnInstallLink(appName) {
        let selector = XPATH.appByDisplayName(appName);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.clickOnElement(selector);
    }

    isDefaultFocused() {
        return this.isFocused(XPATH.filterInput);
    }
}

module.exports = InstallAppDialog;

