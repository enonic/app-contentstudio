/**
 * Created on 18.03.2019.  updated on 19.06.2026
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
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const contentName = contentBuilder.generateRandomName('content');
    const HTML_AREA_X_DATA_NAME = appConst.X_DATA_NAME.HTML_AREA_X_DATA_NAME;
    const TEXT_AREA_X_DATA_NAME = appConst.X_DATA_NAME.TEXT_AREA_X_DATA_NAME;
    const IMAGE_X_DATA_NAME = appConst.X_DATA_NAME.IMAGE_X_DATA_NAME;

    it(`WHEN content with long forms (x-data) is opened AND last step has been clicked THEN required form gets visible`,
        async () => {
            let xDataHtmlArea = new XDataHtmlArea();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_0_1);
            await contentWizard.typeDisplayName(contentName);
            await studioUtils.saveScreenshot('x-data_check');
            // 2. Do enable the first form
            await contentWizard.clickOnXdataMenuTrigger();
            await contentWizard.clickOnXdataMenuItemCheckbox(TEXT_AREA_X_DATA_NAME);
            // 3. Do enable the second form
            await contentWizard.clickOnXdataMenuItemCheckbox(IMAGE_X_DATA_NAME);
            await studioUtils.saveScreenshot('x-data_check_2');
            // 4. Do enable the third form
            await contentWizard.clickOnXdataMenuItemCheckbox(HTML_AREA_X_DATA_NAME);
            await contentWizard.clickOnConfirmXdataButton();
            await studioUtils.saveScreenshot('x-data_check_4');
            // 5. Save the content with long forms
            await contentWizard.waitAndClickOnSave();
            // 6. Close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            // 7. Reopen the content
            await studioUtils.findContentAndClickCheckBox(contentName);
            await studioUtils.doClickOnEditAndOpenContent(contentName);
            await studioUtils.saveScreenshot('x-data_check_5');
            // 8. Click on the last x-data Wizard-Step:
            await contentWizard.clickOnWizardStep(HTML_AREA_X_DATA_NAME);
            // Verify that the last form (html-area) is visible:
            await xDataHtmlArea.waitForHtmlAreaVisible();
            let actualHelpText = await xDataHtmlArea.getHelpText();
            assert.equal(actualHelpText, "html-area help text", "Expected help message should be displayed");

            let result = await contentWizard.isContentInvalid();
            assert.ok(result===true, "The content should be invalid, xdata have required input");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
