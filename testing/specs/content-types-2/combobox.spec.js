/**
 * Created on 19.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ComboBoxForm = require('../../page_objects/wizardpanel/combobox.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');

describe('combobox.content.spec: tests for comboBox content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('combo');
    const CONTENT_NAME_2 = contentBuilder.generateRandomName('combo');
    const COMBO_CHILD_FALSE = contentBuilder.generateRandomName('combo');
    const OPTION_A = "option A";
    const OPTION_B = "option B";

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new not required ComboBox 0:0 is opened WHEN name input have been filled THEN the content gets valid`,
        async () => {
            let comboBoxForm = new ComboBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.COMBOBOX_0_0);
            await contentWizard.typeDisplayName(COMBO_CHILD_FALSE);
            //2. Select a not required option:
            await comboBoxForm.typeInFilterAndClickOnOption(OPTION_A);
            await studioUtils.saveScreenshot("combobox_not_req");
            //3. Verify that options filter input remains visible and enabled after selecting this option:
            await comboBoxForm.waitForOptionFilterInputEnabled();
            //4. Verify that the content gets valid even before clicking on the 'Save' button
            let isInValid = await contentWizard.isContentInvalid();
            assert.isFalse(isInValid, 'the content should be valid, because combobox input is not required');

            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN wizard for new not required ComboBox 1:1 is opened WHEN name input have been filled and required option has been selected THEN the content gets valid`,
        async () => {
            let comboBoxForm = new ComboBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.COMBOBOX_1_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            //2. Select a required option:
            await comboBoxForm.typeInFilterAndClickOnOption(OPTION_A);
            //3. Verify that Options filter Input gets not visible/disabled after selecting a option
            await comboBoxForm.waitForOptionFilterInputDisabled();
            //4. Verify that the content gets valid even before clicking on the 'Save' button
            let isInValid = await contentWizard.isContentInvalid();
            assert.isFalse(isInValid, 'the content should be valid, because combobox input is not required');

            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing content with a selected option(ComboBox 1:1)is opened WHEN the option has been removed THEN the content gets invalid",
        async () => {
            let comboBoxForm = new ComboBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            //2. Remove the selected option:
            await comboBoxForm.clickOnRemoveSelectedOptionButton(0);
            //3. Verify that Options filter Input gets visible/enabled after removing the selected option
            await comboBoxForm.waitForOptionFilterInputEnabled();
            //4. Verify that the content gets not valid even after removing a required selected option:
            let isInValid = await contentWizard.isContentInvalid();
            assert.isTrue(isInValid, 'the content should be not valid, because combobox input is required');
            //5. Verify the message 'This field is required'
            let actualMessage = await comboBoxForm.getComboBoxValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message should appear");
        });

    it("GIVEN wizard for new ComboBox 2:4 is opened WHEN 2 options have been selected THEN the content gets valid",
        async () => {
            let comboBoxForm = new ComboBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.COMBOBOX_2_4);
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            //2. Select 2 required options:
            await comboBoxForm.typeInFilterAndClickOnOption(OPTION_A);
            await comboBoxForm.typeInFilterAndClickOnOption(OPTION_B);
            //3. Verify that Options filter Input remains visible/disabled after selecting 2 options
            await comboBoxForm.waitForOptionFilterInputEnabled();
            //4. Verify that the content gets valid even before clicking on the 'Save' button
            let isInValid = await contentWizard.isContentInvalid();
            assert.isFalse(isInValid, 'the content should be valid, because combobox input is not required');
            //5. Click on 'Mark as Ready' button and save the content
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing ready for publishing content with 2 selected option(ComboBox 2:4)is opened WHEN one option has been removed THEN the content gets invalid",
        async () => {
            let comboBoxForm = new ComboBoxForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_2);
            let result = await comboBoxForm.getSelectedOptionValues();
            assert.isTrue(result.includes(OPTION_A), "Expected option should be selected");
            assert.isTrue(result.includes(OPTION_B), "Expected option should be selected");
            await studioUtils.saveScreenshot("combobox_2_options");
            //2. Remove the selected option:
            await comboBoxForm.clickOnRemoveSelectedOptionButton(1);
            //3. Verify that the content gets not valid even after removing a required selected option:
            let isInValid = await contentWizard.isContentInvalid();
            assert.isTrue(isInValid, 'the content should be invalid, because combobox input is required');
            //5. Verify the message: 'Min 2 valid occurrence(s) required'
            let actualMessage = await comboBoxForm.getComboBoxValidationMessage();
            assert.equal(actualMessage, "Min 2 valid occurrence(s) required", "Expected validation message should appear");
        });

    it("GIVEN existing content with 2 selected options(ComboBox 2:4) is opened WHEN the previous version has been reverted THEN options should not be selected AND the content gets invalid",
        async () => {
            let comboBoxForm = new ComboBoxForm();
            let versionPanel = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            //1. open existing content with 2 selected option
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_2);
            await contentWizard.openVersionsHistoryPanel();
            //3. Revert the previous version:
            await versionPanel.clickAndExpandVersion(1);
            await versionPanel.clickOnRevertButton();
            await studioUtils.saveScreenshot("revert_combobox_invalid_version");
            //4. Verify that no options selected in the form:
            await comboBoxForm.waitForNoOptionsSelected();
            //5. Verify that the content gets invalid
            let isInValid = await contentWizard.isContentInvalid();
            assert.isTrue(isInValid, 'the content gets invalid, because combobox input is required');

            //6. Verify the message: 'Min 2 valid occurrence(s) required'
            let actualMessage = await comboBoxForm.getComboBoxValidationMessage();
            assert.equal(actualMessage, "Min 2 valid occurrence(s) required", "Expected validation message should appear");
        });

    it("GIVEN the content is selected AND allow-child-content-type is 'base:folder' WHEN New Content dialog is opened THEN only one content type should be present",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            //1. Select the existing content, 'allow-child-content-type' = 'base:folder'
            await studioUtils.findAndSelectItem(CONTENT_NAME_2);
            //2. Open New Content Dialog:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await studioUtils.saveScreenshot("allow_child_folder");
            //3. Verify that only folder can be created:
            let actualItems = await newContentDialog.getItems();
            assert.isTrue(actualItems.length === 1, "Only one type should be present in the modal dialog");
        });

    it("WHEN the content is selected AND 'allow-child-content' is 'false' THEN 'New' button should be disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the existing content, 'allow-child-content' is 'false'
            await studioUtils.findAndSelectItem(COMBO_CHILD_FALSE);
            await studioUtils.saveScreenshot("allow_child_false");
            //2. Verify that New button is disabled:
            await contentBrowsePanel.waitForNewButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
