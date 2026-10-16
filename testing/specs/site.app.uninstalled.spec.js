/**
 * Created on 31.03.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require('../libs/content.builder');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');

describe.skip('site.app.uninstalled.spec - ui-tests for a site with uninstalled app', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const CORPORATE_APP_NAME = 'Corporate Site';
    const CORPORATE_APP_DISPLAY_NAME = 'Corporate Theme';
    let SITE;

    it.skip(`Precondition 1: new applications should be installed`, async () => {
        // Do Log in with 'SU', navigate to 'Users' and create new user:
        // TODO
    });

    it.skip('Precondition 2: add new site with the installed application', async () => {
        // 1. navigate to 'CS' and add new site
        await studioUtils.navigateToContentStudioApp();
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', [CORPORATE_APP_DISPLAY_NAME]);
        await studioUtils.doAddSite(SITE);
    });

    it.skip(`Navigate to Applications AND Uninstall 'Corporate Site' app`, async () => {
        // TODO
    });

    it.skip('WHEN site with uninstalled application has been opened  THEN application should be displayed in the site-form panel', async () => {
        // 1. navigate to 'CS' and add new site
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
        let siteFormPanel = new SiteFormPanel();
        await studioUtils.saveScreenshot('site_with_uninstalled_app');
        // Verify that the application is displayed in the form:
        let result = await siteFormPanel.getSelectedAppDisplayNames();
        assert.ok(result[0] === 'com.enonic.app.corporate.theme', 'The application should be displayed in the form');
        // The app should be displayed as uninstalled:
        let isInstalled = await siteFormPanel.isApplicationUninstalled('com.enonic.app.corporate.theme');
        assert.ok(isInstalled, 'The application should be displayed as uninstalled');
    });

    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
