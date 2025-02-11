/**
 * Created on 20.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const RadioButtonForm = require('../../page_objects/wizardpanel/radiobutton.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('radiobutton.content.spec: tests for content with radio buttons', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('radio');
    const CONTENT_NAME_2 = contentBuilder.generateRandomName('radio');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN wizard for new content with not required 'radiobutton' is opened WHEN the name input has been filled THEN the content gets valid",
        async () => {
            let radioButtonForm = new RadioButtonForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.RADIOBUTTON_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            //2. Verify that 'option A' is not selected in the new wizard:
            let isSelected = await radioButtonForm.isRadioSelected(appConst.RADIO_OPTION.OPTION_A);
            assert.ok(isSelected === false, "Option A should not be selected");
            //3. Verify that 'option B' is not selected in the new wizard:
            isSelected = await radioButtonForm.isRadioSelected(appConst.RADIO_OPTION.OPTION_B);
            assert.ok(isSelected === false, "Option B should not be selected");
            //4. Verify that option C is not selected in the new wizard:
            isSelected = await radioButtonForm.isRadioSelected(appConst.RADIO_OPTION.OPTION_C);
            assert.ok(isSelected === false, "Option C should not be selected");
            let isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid === false, 'the content should be valid, because combobox input is not required');
        });

    it("GIVEN wizard for new content with required 'radiobutton' is opened WHEN the name input has been filled AND a radio has been selected THEN the content gets valid",
        async () => {
            let radioButtonForm = new RadioButtonForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.RADIOBUTTON_1_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            // 2. Verify that the radio is not selected in the new wizard:
            let isSelected = await radioButtonForm.isRadioSelected(appConst.RADIO_OPTION.OPTION_A);
            assert.ok(isSelected === false, "Option A should not be selected");
            // 3. Verify that the content is invalid(radio is not selected yet)
            let isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid, 'the content should be invalid, because the radio input is required');
            // 4. Click on the 'option A' radio button:
            await radioButtonForm.clickOnRadio(appConst.RADIO_OPTION.OPTION_A);
            // 5. Verify that the radio is selected now
            isSelected = await radioButtonForm.isRadioSelected(appConst.RADIO_OPTION.OPTION_A);
            await studioUtils.saveScreenshot('radio_not_required');
            assert.ok(isSelected, "'Option A' should be selected");

            // 6. Verify that the content gets valid even before clicking on the 'Save' button
            isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid === false, 'the content should be valid, because the radio is selected now');

            // 7. Click on 'Mark as Ready' button, the content will be automatically saved:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
        });

    it("WHEN existing 'radiobutton' content is reopened THEN expected radio button should be selected",
        async () => {
            let radioButtonForm = new RadioButtonForm();
            // 1. reopen existing checkbox content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_2);
            // 2. Verify that the 'option A'  radio is selected
            await studioUtils.saveScreenshot('radio_content_reopened');
            let isSelected = await radioButtonForm.isRadioSelected(appConst.RADIO_OPTION.OPTION_A);
            assert.ok(isSelected, "'Option A' should be selected");
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
