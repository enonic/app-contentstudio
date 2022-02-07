/**
 * Created on 24.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ConfirmationMask = require('../../page_objects/confirmation.mask');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const OptionSetForm = require('../../page_objects/wizardpanel/optionset/optionset.form.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/single.selection.option.set.view');
const MultiSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/multi.selection.set.view');
const ArticleForm = require('../../page_objects/wizardpanel/article.form.panel');
const NotificationDialog = require('../../page_objects/notification.dialog');

describe("optionset.confirmation.spec: checks for 'confirmation' dialog when deleting an existing or new item-set", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const CONTENT_NAME_1 = appConstant.generateRandomName("set");

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new content with Option Set is opened WHEN name input has been filled AND Save button pressed THEN validation recording should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.OPTION_SET);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            await contentWizard.pause(1000);
            let result = await contentWizard.isContentInvalid();
            assert.isTrue(result, "The Content should be invalid, because an option is not selected in the required 'single selection'");
            await contentWizard.waitAndClickOnSave();
            let recording = await singleSelectionOptionSet.getValidationRecording();
            assert.equal(recording, appConstant.VALIDATION_MESSAGE.SINGLE_SELECTION_OPTION_SET, "Expected message gets visible");
        });

    it(`GIVEN existing invalid content with Option Set is opened WHEN an option in required selection has been selected AND Save button pressed THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open the new wizard:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            //2. Select 'Option 2'
            await optionSetForm.selectOptionInSingleSelection("Option 2");
            await contentWizard.pause(1000);
            //3. The content should be valid:
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "The Content should be valid, because an option is selected in the required 'single selection'");
            await contentWizard.waitAndClickOnSave();
            //4. Validation recording should not be displayed:
            await singleSelectionOptionSet.waitForValidationRecordingNotDisplayed();
        });

    it(`GIVEN existing valid content with Option Set is opened WHEN the selected checkbox in multi selection has been unselected THEN the content gets invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let optionSetForm = new OptionSetForm();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            //1. Open the new wizard:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            //2. Click on 'Option 2' and unselect the checkbox:
            await multiSelectionOptionSet.clickOnOption("Option 2");
            //3. Validation recording should appear:
            let recording = await multiSelectionOptionSet.getValidationRecording();
            assert.equal(recording, appConstant.VALIDATION_MESSAGE.SINGLE_SELECTION_OPTION_SET, "Expected message gets visible");
            //4. The content should be invalid:
            let result = await contentWizard.isContentInvalid();
            assert.isTrue(result, "The content should be invalid, because an option must be selected in the Multi Selection");
        });

    //Verifies: No confirmation given on deletion of a non-empty option-set occurrence #1655
    it(`GIVEN option set with dirty fields WHEN 'Reset' menu item has been clicked THEN 'Notification Dialog' should be loaded`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let notificationDialog = new NotificationDialog();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.OPTION_SET);
            //2. Select 'Option 1' and fill in the option name input :
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            await singleSelectionOptionSet.typeTextInOptionNameInput("test option");
            await singleSelectionOptionSet.expandOptionSetMenuAndClickOnMenuItem(0, "Reset");
            studioUtils.saveScreenshot('item_set_confirmation_dialog');
            //3. NotificationDialog dialog loads, because new item-set has dirty fields:
            await notificationDialog.waitForDialogLoaded();
            //4. Click on Ok button:
            await notificationDialog.clickOnOkButton();
            //5. Verify that notificationDialog closes:
            await notificationDialog.waitForDialogClosed();
        });

    it(`GIVEN wizard for new 'option set' is opened WHEN menu has been expanded in the single item-set THEN 'Delete' menu item should be disabled, Add below and Add above are enabled`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            //2. Select 'Option 1':
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            //3. Expand the menu in the single item set:
            await singleSelectionOptionSet.expandItemSetMenu(0);
            await studioUtils.saveScreenshot('single_item_set_menu_expanded');
            let isDeleteDisabled = await singleSelectionOptionSet.isDeleteSetMenuItemDisabled();
            assert.isTrue(isDeleteDisabled, "Delete menu item should be disabled");
            let isAddAboveDisabled = await singleSelectionOptionSet.isAddAboveSetMenuItemDisabled();
            assert.isFalse(isAddAboveDisabled, "'Add above' menu item should be enabled");
            let isAddBelowDisabled = await singleSelectionOptionSet.isAddBelowSetMenuItemDisabled();
            assert.isFalse(isAddAboveDisabled, "'Add below' menu item should be enabled");
            let isResetDisabled = await singleSelectionOptionSet.isResetMenuItemDisabled();
            assert.isFalse(isResetDisabled, "'Reset' menu item should be enabled");
        });

    //New set with dirty fields: confirmation should appear
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should appear`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            //2. Select 'Option 1' and click on add new item-set:
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            await studioUtils.saveScreenshot('new_item_set_added_1');
            await singleSelectionOptionSet.typeTextInOptionNameInput("test option");
            //3. Type a text in the second item-set:
            await singleSelectionOptionSet.typeInLabelInput("label1", 1);
            //3. Click on 'remove-icon' and try to close the second item-set:
            await singleSelectionOptionSet.expandMenuClickOnDelete(1);
            await studioUtils.saveScreenshot('item_set_confirmation_dialog');
            //"Confirmation mask dialog" should appear, because new item-set has dirty fields:
            await confirmationMask.waitForDialogOpened();
        });

    //New set with no dirty fields (ie only default values): no confirmation
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should not appear`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            //2. Click on add new item-set:
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            studioUtils.saveScreenshot('new_item_set_added_2');
            await singleSelectionOptionSet.typeTextInOptionNameInput("test option");
            //click on remove-icon(remove the second item-set):
            await singleSelectionOptionSet.expandMenuClickOnDelete(1);
            studioUtils.saveScreenshot('item_set_no_confirmation_dialog');
            let result = await confirmationMask.isDialogVisible();
            assert.isFalse(result, "Confirmation mask Dialog should not be loaded, because new item-set has no dirty fields");
        });

    it(`GIVEN Confirmation mask Dialog is opened WHEN 'Esc' key has been pressed THEN 'Confirmation mask Dialog' closes`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            //2. Select 'Option 1' and click on add new item-set:
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            await singleSelectionOptionSet.typeTextInOptionNameInput("test option");
            //3. Type a text in the second item-set:
            await singleSelectionOptionSet.typeInLabelInput("label1", 1);
            //4. Click on 'Delete' menu item and try to delete the second item-set:
            await singleSelectionOptionSet.expandMenuClickOnDelete(1);
            await studioUtils.saveScreenshot('item_set_confirmation_dialog');
            //"Confirmation mask dialog" loads appear, because new item-set has dirty fields:
            await confirmationMask.waitForDialogOpened();
            //5. Press on 'Esc' key:
            await confirmationMask.pressEscKey();
            //6. Verify that Confirmation mask closes:
            await confirmationMask.waitForDialogClosed();
        });

    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    it(`GIVEN wizard for new 'option set' is opened  AND 'Single Selection' form has been clicked WHEN all required inputs have been filled THEN red icon gets not visible(content is valid)`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let contentWizard = new ContentWizard();
            //1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            let displayName = contentBuilder.generateRandomName('optionset');
            await contentWizard.typeDisplayName(displayName);
            //2. Save the name. This content should be saved on this step!!!
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            //3. Click on the radio button and save new changes:
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            //4. Fill in the required 'name' input:
            await singleSelectionOptionSet.typeTextInOptionNameInput("test option");
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('item_set_validation1');
            //5. Verify - "Red icon" should not be displayed, because required inputs are filled in!
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    //OptionSet wizard - Incorrect behavior of validation
    it(`GIVEN wizard for new 'option set' is opened WHEN name has been typed AND Save button pressed THEN Saved button should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            let displayName = contentBuilder.generateRandomName('optionset');
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('item_set_saved_button_wizard');
            //"Saved" button should appear in the wizard-toolbar
            await contentWizard.waitForSavedButtonVisible();
        });

    //Verifies: Incorrect behaviour of validation when two required text inputs/ text area/ text line are present in the wizard #2616
    //https://github.com/enonic/app-contentstudio/issues/2616
    it("GIVEN wizard for new 'article' is opened WHEN article's title and display name are filled in THEN the content should be invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let articleForm = new ArticleForm();
            //1. Open new wizard for article-content:
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.ARTICLE);
            let displayName = contentBuilder.generateRandomName('article');
            //2. Fill in the first required input:
            await articleForm.typeArticleTitle("test");
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.pause(1000);
            //3. Verify that content is invalid, because the second required input is empty:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('article_wizard_1');
            assert.isTrue(result, "Article content should be invalid because required body text area is empty");
        });

    //Verifies: Incorrect behaviour of validation when two required text inputs/ text area/ text line are present in the wizard #2616
    //https://github.com/enonic/app-contentstudio/issues/2616
    it("GIVEN wizard for new 'article' is opened WHEN article's title and display name are filled in AND Save button has been pressed THEN the content should be invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let articleForm = new ArticleForm();
            //1. Open new wizard for article-content:
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.ARTICLE);
            let displayName = contentBuilder.generateRandomName('article');
            //2. Fill in the first required input:
            await articleForm.typeArticleTitle("test");
            await contentWizard.typeDisplayName(displayName);
            //3. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(2000);
            //4. Verify that content is not valid, because the second required input is empty:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('article_wizard_2');
            assert.isTrue(result, "Article content should be invalid because required body text area is empty");
        });

    //Verifies: Incorrect behaviour of validation when two required text inputs/ text area/ text line are present in the wizard #2616
    //https://github.com/enonic/app-contentstudio/issues/2616
    it("GIVEN wizard for new 'article' is opened WHEN both required inputs are filled in AND 'Save' button has been pressed THEN the content should be valid",
        async () => {
            let contentWizard = new ContentWizard();
            let articleForm = new ArticleForm();
            //1. Open new wizard for article-content:
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.ARTICLE);
            let displayName = contentBuilder.generateRandomName('article');
            //2. Fill in the first required input:
            await articleForm.typeArticleTitle("test");
            //2. Fill in the second required input:
            await articleForm.typeInTextArea("body text");
            await contentWizard.typeDisplayName(displayName);
            //3. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(2000);
            //4. Verify that content is not valid, because the second required input is empty:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('article_wizard_3');
            assert.isFalse(result, "Article content should be valid because required inputs are filled");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
