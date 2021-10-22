/**
 * Created by on 6/26/2017.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@class,'launcher-panel')]`,
    userName: "//div[@class='user-info']//p",
    activeLink: "//div[@class='app-row active']//p[@class='app-name']",
    launcherToggler: "//button[contains(@class,'launcher-button')]"
};

class LauncherPanel extends Page {

    get homeLink() {
        return XPATH.container + `//a[contains(@data-id,'home')]`;
    }

    get launcherToggler() {
        return XPATH.launcherToggler;
    }

    get userName() {
        return XPATH.container + XPATH.userName;
    }

    get usersLink() {
        return XPATH.container + `//a[contains(@data-id,'app.users')]`;
    }

    get contentStudioLink() {
        return XPATH.container + `//a[contains(@data-id,'app.contentstudio')]`;
    }

    get applicationsLink() {
        return XPATH.container + `//a[contains(@data-id,'app.applications')]`;
    }

    get logoutLink() {
        return XPATH.container + `//div[@class='user-logout']`;
    }

    async clickOnUsersLink() {
        await this.waitForElementDisplayed(this.usersLink, appConst.mediumTimeout);
        await this.clickOnElement(this.usersLink);
        return await this.pause(500);
    }

    async clickOnContentStudioLink() {
        await this.waitForElementDisplayed(this.contentStudioLink, appConst.longTimeout);
        await this.waitForElementEnabled(this.contentStudioLink, appConst.longTimeout);
        await this.clickOnElement(this.contentStudioLink);
        return await this.pause(1000);
    }

    clickOnLogoutLink() {
        return this.clickOnElement(this.logoutLink);
    }

    waitForLogoutLinkDisplayed() {
        return this.waitForElementDisplayed(this.logoutLink);
    }

    waitForPanelDisplayed(ms) {
        return this.waitForElementDisplayed(XPATH.container, ms).catch(err => {
            return false;
        })
    }

    async waitForPanelClosed() {
        await this.getBrowser().waitUntil(async () => {
            let atr = await this.getAttribute(XPATH.container, 'class');
            return atr.includes('slideout');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Launcher Panel is not hidden: "});
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

    async getActiveLink() {
        let locator = XPATH.container + XPATH.activeLink;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnLauncherToggler() {
        await this.waitForElementDisplayed(this.launcherToggler, appConst.mediumTimeout);
        await this.clickOnElement(this.launcherToggler);
        return await this.pause(400);
    }
}

module.exports = LauncherPanel;
