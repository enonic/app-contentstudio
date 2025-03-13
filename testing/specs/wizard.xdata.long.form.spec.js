/**
 * Created on 18.03.2019.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const XDataHtmlArea = require('../page_objects/wizardpanel/wizard-step-form/xdata.htmlarea.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../libs/app_const');
const assert = require('node:assert');
const DoubleForm = require('../page_objects/wizardpanel/double.form.panel');

describe("wizard.xdata.long.form.spec:  Wizard's navigation toolbar (long forms)", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const contentName = contentBuilder.generateRandomName('content');
    const HTML_AREA_X_DATA_NAME = appConst.X_DATA_NAME.HTML_AREA_X_DATA_NAME;
    const TEXT_AREA_X_DATA_NAME = appConst.X_DATA_NAME.TEXT_AREA_X_DATA_NAME;
    const IMAGE_X_DATA_NAME = appConst.X_DATA_NAME.IMAGE_X_DATA_NAME;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // verifies https://github.com/enonic/lib-admin-ui/issues/909
    // Wizard's navigation toolbar scrolls to incorrect step on long forms
    it(`WHEN content with long forms (x-data) is opened AND last step has been clicked THEN required form gets visible`,
        async () => {
            let xDataHtmlArea = new XDataHtmlArea();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            await contentWizard.typeDisplayName(contentName);
            await studioUtils.saveScreenshot('x-data_check');
            // 2. Do enable the first form
            await contentWizard.clickOnXdataTogglerByName(TEXT_AREA_X_DATA_NAME);
            await studioUtils.saveScreenshot('x-data_check_2');
            // 3. Do enable the second form
            await contentWizard.clickOnXdataTogglerByName(IMAGE_X_DATA_NAME);
            // 4. Do enable the third form
            await contentWizard.clickOnXdataTogglerByName(HTML_AREA_X_DATA_NAME);
            await studioUtils.saveScreenshot('x-data_check_4');
            // 5. Save the content with long forms
            await contentWizard.waitAndClickOnSave();
            // 6. Close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            // 7. Reopen the content
            await studioUtils.selectContentAndOpenWizard(contentName);
            await studioUtils.saveScreenshot('x-data_check_5');
            // 8. Click on the last x-data Wizard-Step:
            await contentWizard.clickOnWizardStep(HTML_AREA_X_DATA_NAME);
            // Verify that the last form (html-area) is visible:
            await xDataHtmlArea.waitForHtmlAreaVisible();
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/8493
    //  Help icons should not be shown for x-data fields #8493
    it(`WHEN content with x-data is opened THEN Help icons should not be shown for x-data fields`,
        async () => {
            let xDataHtmlArea = new XDataHtmlArea();
            let contentWizard = new ContentWizard();
            let doubleForm = new DoubleForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            // 2. Do enable the HtmlArea x-data form
            await contentWizard.clickOnXdataTogglerByName(HTML_AREA_X_DATA_NAME);
            // 3. Click on the x-data Wizard-Step:
            await contentWizard.clickOnWizardStep(HTML_AREA_X_DATA_NAME);
            // 4. Verify that html-area is visible:
            await xDataHtmlArea.waitForHtmlAreaVisible();
            await studioUtils.saveScreenshot('xdasta_help_icons');
            // 5. Help icons should not be shown for x-data fields #8493
            await xDataHtmlArea.waitForHelpTextToggleNotDisplayedInsideXdata();
            // 6. Click on help-icon in the wizard toolbar and verify the help text for HtmlArea:
            await contentWizard.clickOnHelpTextsToggler();
            let actualHelpText = await xDataHtmlArea.getHelpText();
            assert.equal(actualHelpText, "html-area help text", "Expected help message should be displayed");
        });

    it(`WHEN content with x-data is opened THEN Help icons should not be shown for inputs`,
        async () => {
            let contentWizard = new ContentWizard();
            let doubleForm = new DoubleForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            // 2. Verify that help-toggler is not displayed for double input
            await studioUtils.saveScreenshot('double_input_help');
            await doubleForm.waitForHelpTextToggleNotDisplayed();
            // 3. Click on help-icon in the wizard toolbar and verify the help text for double input:
            await contentWizard.clickOnHelpTextsToggler();
            await studioUtils.saveScreenshot('double_input_help_2');
            let actualHelpText = await doubleForm.getHelpText();
            assert.equal(actualHelpText, "help text for double", "Expected help message should be displayed");
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
