/**
 * Created on 25.09.2020.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const PageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../page_objects/wizardpanel/liveform/live.form.panel");

describe('default.error.page.spec tests for Default error page', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`Preconditions: test site should be created`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', ['First Selenium App'], CONTROLLER_NAME);
        await studioUtils.doAddSite(SITE);
    });

    it("WHEN part with errors has been inserted WHEN 'Preview' button has been pressed THEN default error page should be loaded",
        async () => {
            let liveFormPanel = new LiveFormPanel();
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //1. Open Page Component View, open the context menu
            await pageComponentView.openMenu("main");
            //2. click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem(["Insert", "Part"]);
            //3. Select the part with errors:
            await liveFormPanel.selectPartByDisplayName("part-with-error");
            await contentWizard.switchToMainFrame();
            //4. Click on 'Preview' button:
            await contentWizard.clickOnPreviewButton();
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot("default-error-page");
            //5. Verify that Default Error Page is loaded:
            let pageSource = await studioUtils.getPageSource();
            assert.isTrue(pageSource.includes("500 - Internal Server Error"), "Expected title should be loaded");
            assert.isTrue(pageSource.includes("D'oh!"), "Expected message should be loaded");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
