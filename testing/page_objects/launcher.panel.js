/**
 * Created on 6/26/2017.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@class,'launcher-panel')]`,
    userName: "//div[@class='user-info']//p",
    activeAppName: "//div[@class='app-row active']//p[@class='app-name']",
    launcherToggler: "//button[contains(@class,'launcher-button')]"
};

class LauncherPanel extends Page {

    get launcherToggler() {
        return XPATH.launcherToggler;
    }

    get userName() {
        return XPATH.container + XPATH.userName;
    }

    get usersLink() {
        return XPATH.container + `//a[contains(@data-id,'app.users')]//p[@class='app-name']`;
    }

    get contentStudioLink() {
        return XPATH.container + `//a[contains(@data-id,'app.contentstudio')]//p[@class='app-name']`;
    }

    get applicationsLink() {
        return XPATH.container + `//a[contains(@data-id,'app.applications')]`;
    }

    get logoutLink() {
        return XPATH.container + `//div[@class='user-logout']`;
    }

    async clickOnUsersLink() {
        await this.waitForElementDisplayed(this.usersLink, appConst.mediumTimeout);
        await this.waitForElementEnabled(this.usersLink, appConst.longTimeout);
        await this.pause(200);
        await this.clickOnElement(this.usersLink);
        return await this.pause(300);
    }

    async clickOnApplicationsLink() {
        await this.waitForElementDisplayed(this.applicationsLink, appConst.mediumTimeout);
        await this.waitForElementEnabled(this.applicationsLink, appConst.mediumTimeout);

        await this.clickOnElement(this.applicationsLink);
        return await this.pause(200);
    }

    async clickOnContentStudioLink() {
        try {
            await this.waitForElementDisplayed(this.contentStudioLink, appConst.longTimeout);
            await this.waitForElementEnabled(this.contentStudioLink, appConst.mediumTimeout);
            await this.pause(300);
            await this.clickOnElement(this.contentStudioLink);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Launcher Panel: tried to click on Content Studio link', 'err_click_content_studio_link', err);
        }
    }

    clickOnLogoutLink() {
        return this.clickOnElement(this.logoutLink);
    }

    waitForLogoutLinkDisplayed() {
        return this.waitForElementDisplayed(this.logoutLink);
    }

    isDisplayed(ms) {
        return this.waitForElementDisplayed(XPATH.container, ms).catch(err => {
            return false;
        })
    }

    async waitForPanelDisplayed() {
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        await this.pause(500);
    }

    async waitForPanelClosed() {
        await this.getBrowser().waitUntil(async () => {
            let atr = await this.getAttribute(XPATH.container, 'class');
            return !atr.includes('visible');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Launcher Panel is not hidden: '});
    }

    async isPanelOpened() {
        let result = await this.getAttribute(XPATH.container, 'class');
        return result.includes('visible')
    }

    isApplicationsLinkDisplayed() {
        return this.waitForElementDisplayed(this.applicationsLink, appConst.shortTimeout).catch(err => {
            return false;
        })
    }

    isUsersLinkDisplayed() {
        return this.waitForElementDisplayed(this.usersLink, appConst.shortTimeout).catch(err => {
            return false;
        })
    }

    async getCurrentUser() {
        await this.waitForElementDisplayed(this.userName, appConst.mediumTimeout);
        return await this.getText(this.userName);
    }

    async getActiveRowName() {
        try {
            let locator = XPATH.container + XPATH.activeAppName;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Launcher Panel: tried to get active row name', 'err_get_active_row_name', err);
        }
    }

    async clickOnLauncherToggler() {
        try {
            await this.waitForElementDisplayed(this.launcherToggler, appConst.mediumTimeout);
            await this.clickOnElement(this.launcherToggler);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Launcher Panel: tried to click on Launcher Toggle', 'err_click_launcher_toggler', err);
        }
    }
}

module.exports = LauncherPanel;
