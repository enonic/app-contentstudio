/**
 * Created on 05.02.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('Custom error handling - specification. Verify that application error page is loaded when error occurred', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_WITH_ERROR = 'Page with error';
    const ERROR_MESSAGE_LIVE_EDIT = "Failed to render content preview.";

    it(`WHEN a controller with error has been selected THEN 'Preview' button should not be displayed in the wizard toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_WITH_ERROR);
            // 1. Open new wizard for a site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            await contentWizard.pause(1000);
            // 2. Select a controller with error:
            await contentWizard.selectPageDescriptor(CONTROLLER_WITH_ERROR, false);
            await contentWizard.pause(500);
            await studioUtils.saveScreenshot("site_controller_with_errors");
            // 3. Verify that 'Preview' button is not displayed in the wizard:
            await contentWizard.waitForPreviewButtonNotDisplayed();
            // 4. 'Hide Page Editor' button should be visible
            await contentWizard.waitForHidePageEditorTogglerButtonDisplayed();
            await contentWizard.waitForMinimizeLiveEditTogglerDisplayed()
            // 5. Verify that 'Failed to render content preview' message appears in the wizard page:
            await contentWizard.waitForErrorMessageInLiveFormPanel(ERROR_MESSAGE_LIVE_EDIT);
            await studioUtils.doCloseCurrentBrowserTab();
            await studioUtils.doSwitchToContentBrowsePanel();
            // 6. Verify that 'Preview' button is disabled in the browse panel toolbar:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.pause(1000);
            await contentBrowsePanel.waitForPreviewButtonDisabled();
        });

    it(`GIVEN existing site(controller has a error) WHEN the site has been opened in draft THEN expected error page should be loaded in the browser page`,
        async () => {
            // 1. get the URL: http://localhost:8080/admin/site/preview/default/draft/site554821
            await studioUtils.openResourceInDraft(SITE.displayName);
            // 2. Verify the page source:
            let pageSource = await studioUtils.getPageSource();
            await studioUtils.saveScreenshot('custom_error_handling');
            assert.include(pageSource, 'Oops, something went wrong!', "Expected message should be in the error page!");
            assert.include(pageSource, 'System got an error 500', "Expected response code should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
