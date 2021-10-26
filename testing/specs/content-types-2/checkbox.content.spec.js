/**
 * Created on 14.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CheckBoxForm = require('../../page_objects/wizardpanel/checkbox.fom.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('checkbox.content.spec: tests for content with checkbox', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const CHECKBOX_NAME = contentBuilder.generateRandomName('checkbox');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN wizard for new 'checkbox(0:1)' content is opened WHEN the checkbox has been clicked THEN checkbox should be selected",
        async () => {
            let checkBoxForm = new CheckBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CHECKBOX_0_1);
            await contentWizard.typeDisplayName(CHECKBOX_NAME);
            //2. Verify that the checkbox is not selected by default
            let isSelected = await checkBoxForm.isCheckBoxSelected();
            await studioUtils.saveScreenshot('checkbox_1');
            assert.isFalse(isSelected, "CheckBox should not be selected by default");
            //3. Click on the checkbox
            await checkBoxForm.clickOnCheckbox();
            await studioUtils.saveScreenshot('checkbox_2');
            //4. Verify that the checkbox gets selected:
            isSelected = await checkBoxForm.isCheckBoxSelected();
            assert.isTrue(isSelected, "Checkbox should be selected");

            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("WHEN existing 'checkbox' content is reopened THEN checkbox should be selected",
        async () => {
            let checkBoxForm = new CheckBoxForm();
            let contentWizard = new ContentWizard();
            //1. open existing checkbox content:
            await studioUtils.selectAndOpenContentInWizard(CHECKBOX_NAME);
            //2. Verify that the checkbox is selected
            await studioUtils.saveScreenshot('checkbox_3');
            let isSelected = await checkBoxForm.isCheckBoxSelected();
            assert.isTrue(isSelected, "CheckBox should be selected");
        });

    //TODO add test to verify issue https://github.com/enonic/app-contentstudio/issues/3665
    //Incorrect validation for checkbox input type #3665

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
