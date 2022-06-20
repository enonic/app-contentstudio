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
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");

describe('Custom error handling - specification. Verify that application error page is loaded when error occurred', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_WITH_ERROR = 'Page with error';

    it(`WHEN a controller with error has been selected THEN 'Preview' button should be disabled in the browse toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.SIMPLE_SITE_APP], CONTROLLER_WITH_ERROR);
            //1. Open new wizard for a site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            //2. Select a controller with error:
            await contentWizard.selectPageDescriptor(CONTROLLER_WITH_ERROR);
            await studioUtils.saveScreenshot("site_controller_with_errors");
            //3. Verify that 'Preview' button is not displayed in the wizard:
            await contentWizard.waitForPreviewButtonNotDisplayed();
            //4. 'Show Component View' should not be visible
            await contentWizard.waitForShowComponentVewTogglerNotVisible();
            //4. Verify that 'Failed to render content preview' message appears in the 'Live Form' panel:
            let message = await liveFormPanel.getErrorMessage();
            assert.equal(message, "Failed to render content preview.");
            await studioUtils.doCloseCurrentBrowserTab();
            await studioUtils.doSwitchToContentBrowsePanel();
            //5. Verify that Preview button is disabled on the browse toolbar:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.pause(1000);
            await contentBrowsePanel.waitForPreviewButtonDisabled();
        });

    it(`GIVEN existing site(controller has a error) WHEN the site has been opened in draft THEN expected error page should be loaded in the browser page`,
        async () => {
            //1. get the URL: http://localhost:8080/admin/site/preview/default/draft/site554821
            await studioUtils.openResourceInDraft(SITE.displayName);
            //2. Verify the page source:
            let pageSource = await studioUtils.getPageSource();
            await studioUtils.saveScreenshot('custom_error_handling');
            assert.include(pageSource, 'Oops, something went wrong!', "Expected message should be in the error page!");
            assert.include(pageSource, 'System got an error 500', "Expected response code should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
