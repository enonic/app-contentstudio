/**
 * Created on 14.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CheckBoxForm = require('../../page_objects/wizardpanel/checkbox.fom.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('checkbox.content.spec: tests for content with checkbox', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const CHECKBOX_NAME = contentBuilder.generateRandomName('checkbox');
    const CHECKBOX_NAME_2 = contentBuilder.generateRandomName('checkbox');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN wizard for new 'checkbox(0:1)' content is opened WHEN the checkbox has been clicked THEN checkbox should be selected",
        async () => {
            let checkBoxForm = new CheckBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CHECKBOX_0_1);
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

    //https://github.com/enonic/lib-admin-ui/issues/2344
    //Incorrect validation for checkbox input type #3665
    it("GIVEN wizard for content with required checkbox is opened WHEN name input has been filled in AND Save button pressed THEN validation recording gets visible",
        async () => {
            let checkBoxForm = new CheckBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CHECKBOX_1_1);
            await contentWizard.typeDisplayName(CHECKBOX_NAME_2);
            await contentWizard.pause(1000);
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Content should be invalid");
            //2. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('checkbox_required_1');
            await contentWizard.waitForNotificationMessage();
            //3. Verify that the validation recording gets visible
            let recording = await checkBoxForm.getFormValidationRecording();
            assert.equal(recording, appConst.THIS_FIELD_IS_REQUIRED, "Expected validation message should be displayed");

            //4. Select the checkbox:
            await checkBoxForm.clickOnCheckbox();
            await studioUtils.saveScreenshot('checkbox_required_2');
            //5. Verify that validation recording gets not visible
            await checkBoxForm.waitForFormValidationRecordingNotDisplayed();
            //6. The content gets valid
            isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
            //7. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    //Verifies https://github.com/enonic/lib-admin-ui/issues/2391
    //Content with required checkbox remains valid in grid after unselecting this checkbox #2391
    it("GIVEN existing 'checkbox' content is reopened WHEN checkbox has been unchecked THEN the content should be invalid in the grid",
        async () => {
            let checkBoxForm = new CheckBoxForm();
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. open existing checkbox content:
            await studioUtils.selectAndOpenContentInWizard(CHECKBOX_NAME_2);
            //2. unselect the required checkbox
            await checkBoxForm.clickOnCheckbox();
            //3. Verify that the checkbox is not selected now:
            await studioUtils.saveScreenshot('checkbox_umselected_2');
            let isSelected = await checkBoxForm.isCheckBoxSelected();
            assert.isFalse(isSelected, "CheckBox should be unselected");
            //4. The content gets invalid now:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Content should be invalid");
            //5. Save the invalid content and close the wizard:
            await studioUtils.saveAndCloseWizard();
            //6. Verify that the content is invalid in the grid:
            await studioUtils.findAndSelectItem(CHECKBOX_NAME_2);
            await studioUtils.saveScreenshot('checkbox_content_invalid');
            //TODO uncomment it lib-admin-ui/issues/2391
            //await contentBrowsePanel.waitForRedIconDisplayed(CHECKBOX_NAME_2);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
