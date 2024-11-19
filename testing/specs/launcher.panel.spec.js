/**
 * Created on 21.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const LauncherPanel = require('../page_objects/launcher.panel');
const LoginPage = require('../page_objects/login.page');
const appConst = require('../libs/app_const');

describe('launcher.panel.spec: tests for Launcher Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const LAUNCHER_DASHBOARD_IS_ACTIVE = 'Dashboard';

    it("WHEN su is logged in THEN 'Dashboard' link should be active, 'Super User' is current user",
        async () => {
            let launcherPanel = new LauncherPanel();
            await launcherPanel.waitForPanelDisplayed();
            await studioUtils.saveScreenshot('launcher_panel_active_row')
            let currentUser = await launcherPanel.getCurrentUser();
            assert.equal(currentUser, appConst.systemUsersDisplayName.SUPER_USER);
            let appName = await launcherPanel.getActiveRowName();
            assert.equal(appName, LAUNCHER_DASHBOARD_IS_ACTIVE, 'Dashboard link should be active');
        });

    it("GIVEN su is logged in WHEN 'Close XP menu' button has been clicked THEN launcher panel gets not visible",
        async () => {
            let launcherPanel = new LauncherPanel();
            await launcherPanel.waitForPanelDisplayed();
            await launcherPanel.clickOnLauncherToggler();
            await studioUtils.saveScreenshot('launcher_closed');
            await launcherPanel.waitForPanelClosed();
        });

    it("GIVEN navigated to 'Content Studio' tab WHEN launcher panel has been opened THEN 'Content Studio' link should be active",
        async () => {
            let launcherPanel = new LauncherPanel();
            let result = await launcherPanel.isPanelOpened();
            if (!result) {
                await launcherPanel.clickOnLauncherToggler();
            }
            await launcherPanel.waitForPanelDisplayed();
            // 1. Click on 'Content Studio' link
            await launcherPanel.clickOnContentStudioLink();
            // 2. Open Launcher Panel in the tab with browse panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await launcherPanel.clickOnLauncherToggler();
            let appNAme = await launcherPanel.getActiveRowName();
            assert.equal(appNAme, 'Content Studio', 'contentstudio link should be active');
        });

    it("GIVEN su is logged in WHEN 'Log out' link has been clicked THEN login page should be loaded",
        async () => {
            let launcherPanel = new LauncherPanel();
            let loginPage = new LoginPage();
            let result = await launcherPanel.isPanelOpened();
            if (!result) {
                await launcherPanel.clickOnLauncherToggler();
            }
            await launcherPanel.waitForPanelDisplayed();
            await launcherPanel.clickOnLogoutLink();
            await studioUtils.saveScreenshot('logout_link_pressed');
            await loginPage.waitForPageLoaded();
        });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        let loginPage = new LoginPage();
        await loginPage.waitForPageLoaded()
        await loginPage.doLogin('su', 'password');
        return console.log('specification is starting: ' + this.title);
    });
});
