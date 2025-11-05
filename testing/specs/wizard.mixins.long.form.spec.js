/**
 * Created on 18.03.2019.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const MixinsHtmlArea = require('../page_objects/wizardpanel/wizard-step-form/mixins.htmlarea.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../libs/app_const');
const assert = require('node:assert');
const DoubleForm = require('../page_objects/wizardpanel/double.form.panel');

describe("wizard.mixins.long.form.spec:  Wizard's navigation toolbar (long forms)", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const contentName = contentBuilder.generateRandomName('content');
    const HTML_AREA_MIXINS_NAME = appConst.MIXINS_NAME.HTML_AREA_MIXINS_NAME;
    const TEXT_AREA_MIXINS_NAME = appConst.MIXINS_NAME.TEXT_AREA_MIXINS_NAME;
    const IMAGE_MIXINS_NAME = appConst.MIXINS_NAME.IMAGE_MIXINS_NAME;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // verifies https://github.com/enonic/lib-admin-ui/issues/909
    // Wizard's navigation toolbar scrolls to incorrect step on long forms
    it(`WHEN content with long forms (mixins) is opened AND last step has been clicked THEN required form gets visible`,
        async () => {
            let mixinsHtmlArea = new MixinsHtmlArea();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            await contentWizard.typeDisplayName(contentName);
            await studioUtils.saveScreenshot('mixins_check');
            // 2. Do enable the first form
            await contentWizard.clickOnMixinsTogglerByName(TEXT_AREA_MIXINS_NAME);
            await studioUtils.saveScreenshot('mixins_check_2');
            // 3. Do enable the second form
            await contentWizard.clickOnMixinsTogglerByName(IMAGE_MIXINS_NAME);
            // 4. Do enable the third form
            await contentWizard.clickOnMixinsTogglerByName(HTML_AREA_MIXINS_NAME);
            await studioUtils.saveScreenshot('mixins_check_4');
            // 5. Save the content with long forms
            await contentWizard.waitAndClickOnSave();
            // 6. Close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            // 7. Reopen the content
            await studioUtils.selectContentAndOpenWizard(contentName);
            await studioUtils.saveScreenshot('mixins_check_5');
            // 8. Click on the last mixins Wizard-Step:
            await contentWizard.clickOnWizardStep(HTML_AREA_MIXINS_NAME);
            // Verify that the last form (html-area) is visible:
            await mixinsHtmlArea.waitForHtmlAreaVisible();
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/8493
    //  Help icons should not be shown for mixins fields #8493
    it(`WHEN content with mixins is opened THEN Help icons should not be shown for mixins fields`,
        async () => {
            let mixinsHtmlArea = new MixinsHtmlArea();
            let contentWizard = new ContentWizard();
            let doubleForm = new DoubleForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            // 2. Do enable the HtmlArea mixins form
            await contentWizard.clickOnMixinsTogglerByName(HTML_AREA_MIXINS_NAME);
            // 3. Click on the mixins Wizard-Step:
            await contentWizard.clickOnWizardStep(HTML_AREA_MIXINS_NAME);
            // 4. Verify that html-area is visible:
            await mixinsHtmlArea.waitForHtmlAreaVisible();
            await studioUtils.saveScreenshot('xdasta_help_icons');
            // 5. Help icons should not be shown for mixins fields #8493
            await mixinsHtmlArea.waitForHelpTextToggleNotDisplayedInsideMixins();
            // 6. Click on help-icon in the wizard toolbar and verify the help text for HtmlArea:
            await contentWizard.clickOnHelpTextsToggler();
            let actualHelpText = await mixinsHtmlArea.getHelpText();
            assert.equal(actualHelpText, "html-area help text", "Expected help message should be displayed");
        });

    it(`WHEN content with mixins is opened THEN Help icons should not be shown for inputs`,
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
