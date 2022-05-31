/**
 * Created on 18.03.2019.
 */
const chai = require('chai');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const XDataHtmlArea = require('../page_objects/wizardpanel/xdata.htmlarea.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe("wizard.xdata.long.form.spec:  Wizard's navigation toolbar (long forms)", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let contentName = contentBuilder.generateRandomName('content');
    let X_DATA_STEP_WIZARD = 'Html Area x-data';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //verifies https://github.com/enonic/lib-admin-ui/issues/909
    //Wizard's navigation toolbar scrolls to incorrect step on long forms
    it(`WHEN content with long forms (x-data) is opened AND last step has been clicked THEN required form gets visible`,
        async () => {
            let xDataHtmlArea = new XDataHtmlArea();
            let contentWizard = new ContentWizard();
            //1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double0_1');
            await contentWizard.typeDisplayName(contentName);
            await studioUtils.saveScreenshot("x-data_check");
            //2. Do enable the first form
            await contentWizard.clickOnXdataTogglerByName("Text Area x-data");
            await studioUtils.saveScreenshot("x-data_check_2");
            //3. Do enable the second form
            await contentWizard.clickOnXdataTogglerByName("X-data (image selector)");
            //4. Do enable the third form
            await contentWizard.clickOnXdataTogglerByName("Html Area x-data");
            await studioUtils.saveScreenshot("x-data_check_4");
            //5. Save the content with long forms
            await contentWizard.waitAndClickOnSave();
            //6. Close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            //7. Reopen the content
            await studioUtils.selectContentAndOpenWizard(contentName);
            await studioUtils.saveScreenshot("x-data_check_5");
            //8. Click on the last x-data Wizard-Step:
            await contentWizard.clickOnWizardStep(X_DATA_STEP_WIZARD);
            //Verify that the last form (html-area) is visible:
            await xDataHtmlArea.waitForHtmlAreaVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(width, height)();
        }
        return console.log('specification starting: ' + this.title);
    });
});
