/**
 * Created on 21.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const LauncherPanel = require('../page_objects/launcher.panel');
const LoginPage = require('../page_objects/login.page');

describe('launcher.panel.spec: test for Launcher Panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it("WHEN su is logged in THEN 'Home' link should be active, Super User is current user",
        async () => {
            let launcherPanel = new LauncherPanel();
            await launcherPanel.waitForPanelDisplayed(appConstant.mediumTimeout);
            let currentUser = await launcherPanel.getCurrentUser();
            assert.equal(currentUser, "Super User");
            let result = await launcherPanel.getActiveLink();
            assert.equal(result, "Home", "'Home' should be active link");
        });

    it("GIVEN su is logged in WHEN 'Close XP menu' button has been clicked THEN launcher panel gets not visible",
        async () => {
            let launcherPanel = new LauncherPanel();
            await launcherPanel.waitForPanelDisplayed(appConstant.mediumTimeout);
            await launcherPanel.clickOnLauncherToggler();
            await studioUtils.saveScreenshot("launcher_closed");
            await launcherPanel.waitForPanelClosed();
        });

    it("GIVEN su is logged in WHEN 'Log out' link has been clicked THEN login page should be loaded",
        async () => {
            let launcherPanel = new LauncherPanel();
            let loginPage = new LoginPage();
            let result = await launcherPanel.isPanelOpened();
            if (!result) {
                await launcherPanel.clickOnLauncherToggler();
            }
            await launcherPanel.waitForPanelDisplayed(appConstant.mediumTimeout);
            await launcherPanel.clickOnLogoutLink();
            await studioUtils.saveScreenshot("logout_link_pressed");
            await loginPage.waitForPageLoaded();
        });

    before(async () => {
        let loginPage = new LoginPage();
        await loginPage.waitForPageLoaded()
        await loginPage.doLogin('su', 'password');
        return console.log('specification is starting: ' + this.title);
    });
});
