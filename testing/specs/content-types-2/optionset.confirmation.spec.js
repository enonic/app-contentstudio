/**
 * Created on 24.01.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ConfirmationMask = require('../../page_objects/confirmation.mask');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/single.selection.option.set.view');
const MultiSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/multi.selection.set.view');
const ArticleForm = require('../../page_objects/wizardpanel/article.form.panel');
const NotificationDialog = require('../../page_objects/notification.dialog');
const OptionSetHelpFormView = require('../../page_objects/wizardpanel/optionset/option.set.help.text.form');
const appConst = require('../../libs/app_const');

describe("optionset.confirmation.spec: checks for 'confirmation' dialog when deleting an existing or new item-set", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME_1 = appConst.generateRandomName('set');
    const NOTIFICATION_DIALOG_TEXT = 'The fields inside deselected option will be cleared on save!';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN insert 'option 1' (lower case) in options filter input WHEN the filtered option has been clicked THEN 'Option 1' should be selected`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. Open wizard for new option set:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET_HELP_TEXT);
            // 2. Type the text 'option 1' in lower case and select the option in Single selection radio option set:
            await singleSelectionOptionSet.filterAndSelectOption('option 1');
            // 3. Verify the menu items in the selected option:
            await singleSelectionOptionSet.expandMoreMenuInSingleSelectionOptionSet(0)
            let isDeleteDisabled = await singleSelectionOptionSet.isDeleteMenuItemInSingleSelectedOptionDisabled();
            assert.ok(isDeleteDisabled, "'Delete' menu item should be disabled");
            let isResetDisabled = await singleSelectionOptionSet.isResetMenuItemInSingleSelectedOptionDisabled();
            // 4.  Only 'Reset' menu item is enabled due to the config: <occurrences minimum="1" maximum="1"/>
            assert.ok(isResetDisabled === false, "'Reset' menu item should be enabled");
            // 5. 'Add above' menu item is disabled due to the config: <occurrences minimum="1" maximum="1"/>
            let isAddAboveDisabled = await singleSelectionOptionSet.isAddAboveMenuItemInSingleSelectedOptionDisabled();
            assert.ok(isAddAboveDisabled, "'Add above' menu item should be disabled");
        });

    it(`GIVEN wizard for new content with Option Set is opened WHEN name input has been filled AND Save button pressed THEN validation recording should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            // 2. Fill in the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            await contentWizard.pause(1000);
            // 3. Verify that the content is invalid:
            let result = await contentWizard.isContentInvalid();
            assert.ok(result, "The Content should be invalid, because the required option is not selected in 'single selection'");
            // 4. Click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            // 5. Verify the validation message:
            let recording = await singleSelectionOptionSet.getValidationRecording();
            assert.equal(recording, appConst.VALIDATION_MESSAGE.SINGLE_SELECTION_OPTION_SET, "Expected message gets visible");
        });

    // Verifies: Unchecking an option in an option-set should clear its underlying property set #5096
    // https://github.com/enonic/app-contentstudio/issues/5096
    it(`GIVEN existing content with Option Set is opened AND text has been typed in the option with htmlArea WHEN the option has been unchecked AND confirmed THEN Save button should gets disabled again`,
        async () => {
            let contentWizard = new ContentWizard();
            let notificationDialog = new NotificationDialog();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            // 1. Open the existing content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            // 2. Click on 'Option 3' and select the checkbox:
            await multiSelectionOptionSet.clickOnOption('Option 3');
            await contentWizard.pause(1000);
            // 3. Insert a text in htmlArea in the set:
            await multiSelectionOptionSet.typeTextInHtmlAreaInOption3(0, 'test text');
            // 4. Click again and uncheck the 'option 3'
            await multiSelectionOptionSet.clickOnOption('Option 3');
            // 5. Verify that Notification dialog is loaded:
            await notificationDialog.waitForDialogLoaded();
            let actualText = await notificationDialog.getDialogText();
            // 6. Click on Ok button in Notification modal dialog
            await notificationDialog.clickOnOkButton();
            // 7. Verify that 'Save' button gets disabled again
            await contentWizard.waitForSaveButtonDisabled();
            // "The fields inside deselected option will be cleared on save!";
            assert.equal(actualText, NOTIFICATION_DIALOG_TEXT, 'Expected text should be in Notification dialog');
        });

    it(`GIVEN existing invalid content with Option Set is opened WHEN an option in required selection has been selected AND Save button pressed THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. Open the new wizard:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            // 2. Select 'Option 2' in Single Selection radio option set:
            await singleSelectionOptionSet.selectOption('Option 2');
            await contentWizard.pause(1000);
            // 3. The content should be valid:
            let result = await contentWizard.isContentInvalid();
            assert.ok(result === false, "The Content should be valid, because an option is selected in the required 'single selection'");
            await contentWizard.waitAndClickOnSave();
            // 4. Validation recording should not be displayed:
            await singleSelectionOptionSet.waitForValidationRecordingNotDisplayed();
        });

    it(`GIVEN existing valid content with Option Set is opened WHEN the selected checkbox in multi selection has been unselected THEN the content gets invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            // 1. Open the new wizard:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            // 2. Click on 'Option 2' and unselect the checkbox:
            await multiSelectionOptionSet.clickOnOption('Option 2');
            // 3. Validation recording should appear in Multi selection option set;
            let recording = await multiSelectionOptionSet.getValidationRecording();
            // At least one option must be selected:
            assert.equal(recording, appConst.VALIDATION_MESSAGE.SINGLE_SELECTION_OPTION_SET, "Expected message should be visible");
            // 4. The content should be invalid:
            let result = await contentWizard.isContentInvalid();
            assert.ok(result, "The content should be invalid, because an option must be selected in the Multi Selection");
        });

    // Verifies: No confirmation given on deletion of a non-empty option-set occurrence #1655
    it(`GIVEN option set with dirty fields WHEN 'Reset' menu item has been clicked THEN 'Notification Dialog' should be loaded`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let notificationDialog = new NotificationDialog();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            // 2. Select 'Option 1' and fill in the option name input :
            await singleSelectionOptionSet.selectOption('Option 1');
            await singleSelectionOptionSet.typeTextInOptionNameInput('test option');
            // 3. Expand the menu and click on 'Reset' menu item:
            await singleSelectionOptionSet.expandOptionSetMenuAndClickOnMenuItem(0, 'Reset');
            await studioUtils.saveScreenshot('item_set_confirmation_dialog');
            // 3. NotificationDialog dialog loads, because new item-set has dirty fields:
            await notificationDialog.waitForDialogLoaded();
            // 4. Click on 'Ok' button:
            await notificationDialog.clickOnOkButton();
            // 5. Verify that notificationDialog closes:
            await notificationDialog.waitForDialogClosed();
        });

    it(`GIVEN wizard for new 'option set' is opened WHEN menu has been expanded in the single item-set THEN 'Delete' menu item should be disabled, Add below and Add above are enabled`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            // 2. Select 'Option 1':
            await singleSelectionOptionSet.selectOption('Option 1');
            // 3. Expand the menu in the single item set:
            await singleSelectionOptionSet.expandItemSetMenu(0);
            // 4. Verify that 3 menu items are displayed:
            let items = await singleSelectionOptionSet.getOccurrenceViewMenuItems();
            assert.equal(items.length, 3, "Three menu items should be displayed in the occurrence menu");
            await studioUtils.saveScreenshot('single_item_set_menu_expanded');
            // 5. Verify that 'Delete' menu item is disabled, 'Add below' and 'Add above' are enabled
            let isDeleteDisabled = await singleSelectionOptionSet.isDeleteSetMenuItemDisabled();
            assert.ok(isDeleteDisabled, "Delete menu item should be disabled");
            let isAddAboveDisabled = await singleSelectionOptionSet.isAddAboveSetMenuItemDisabled();
            assert.ok(isAddAboveDisabled === false, "'Add above' menu item should be enabled");
            let isAddBelowDisabled = await singleSelectionOptionSet.isAddBelowSetMenuItemDisabled();
            assert.ok(isAddBelowDisabled === false, "'Add below' menu item should be enabled");
        });

    // New set with dirty fields: confirmation should appear
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should appear`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            // 2. Select 'Option 1' and click on add new item-set:
            await singleSelectionOptionSet.selectOption('Option 1');
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            await studioUtils.saveScreenshot('new_item_set_added_1');
            await singleSelectionOptionSet.typeTextInOptionNameInput('test option');
            // 3. Type a text in the second item-set:
            await singleSelectionOptionSet.typeInLabelInput('label1', 1);
            // 4. Click on 'remove-icon' and try to close the second item-set:
            await singleSelectionOptionSet.expandMenuClickOnDelete(1);
            await studioUtils.saveScreenshot('item_set_confirmation_dialog');
            // 5. "Confirmation mask dialog" should appear, because new item-set has dirty fields:
            await confirmationMask.waitForDialogOpened();
        });

    // New set with no dirty fields (ie only default values): no confirmation
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should not appear`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            await singleSelectionOptionSet.selectOption('Option 1');
            // 2. Click on add new item-set:
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            await studioUtils.saveScreenshot('new_item_set_added_2');
            await singleSelectionOptionSet.typeTextInOptionNameInput('test option');
            // click on remove-icon(remove the second item-set):
            await singleSelectionOptionSet.expandMenuClickOnDelete(1);
            await studioUtils.saveScreenshot('item_set_no_confirmation_dialog');
            let result = await confirmationMask.isDialogVisible();
            assert.ok(result === false, 'Confirmation mask Dialog should not be loaded, because new item-set has no dirty fields');
        });

    it(`GIVEN Confirmation mask Dialog is opened WHEN 'Esc' key has been pressed THEN 'Confirmation mask Dialog' closes`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationMask = new ConfirmationMask();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            // 2. Select 'Option 1' and click on add new item-set:
            await singleSelectionOptionSet.selectOption('Option 1');
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            await singleSelectionOptionSet.typeTextInOptionNameInput('test option');
            // 3. Type a text in the second item-set:
            await singleSelectionOptionSet.typeInLabelInput('label1', 1);
            // 4. Click on 'Delete' menu item and try to delete the second item-set:
            await singleSelectionOptionSet.expandMenuClickOnDelete(1);
            await studioUtils.saveScreenshot('item_set_confirmation_dialog');
            // "Confirmation mask dialog" loads appear, because new item-set has dirty fields:
            await confirmationMask.waitForDialogOpened();
            // 5. Press on 'Esc' key:
            await confirmationMask.pressEscKey();
            // 6. Verify that Confirmation mask closes:
            await confirmationMask.waitForDialogClosed();
        });

    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    it(`GIVEN wizard for new 'option set' is opened  AND 'Single Selection' form has been clicked WHEN all required inputs have been filled THEN red icon gets not visible(content is valid)`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            let displayName = contentBuilder.generateRandomName('optionset');
            await contentWizard.typeDisplayName(displayName);
            // 2. Save the name. This content should be saved on this step!!!
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            await contentWizard.scrollPanel(-400);
            // 3. Click on the radio button and save new changes:
            await singleSelectionOptionSet.selectOption('Option 1');
            // 4. Fill in the required 'name' input:
            await singleSelectionOptionSet.typeTextInOptionNameInput('test option');
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('item_set_validation1');
            // 5. Verify - "Red icon" should not be displayed, because required inputs are filled in!
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    // OptionSet wizard - Incorrect behavior of validation
    it(`GIVEN wizard for new 'option set' is opened WHEN name has been typed AND Save button pressed THEN Saved button should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            let displayName = contentBuilder.generateRandomName('optionset');
            // 1. Fill in the name input
            await contentWizard.typeDisplayName(displayName);
            // 2. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('item_set_saved_button_wizard');
            // 3. Verify - "Saved" button should appear in the wizard-toolbar
            await contentWizard.waitForSavedButtonVisible();
            // 4. The content should be invalid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "The content should be invalid because required option is not selected");
        });

    // Verifies: Incorrect behaviour of validation when two required text inputs/ text area/ text line are present in the wizard #2616
    // https://github.com/enonic/app-contentstudio/issues/2616
    it("GIVEN wizard for new 'article' is opened WHEN article's title and display name are filled in THEN the content should be invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let articleForm = new ArticleForm();
            // 1. Open new wizard for article-content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            let displayName = contentBuilder.generateRandomName('article');
            // 2. Fill in the first required input:
            await articleForm.typeArticleTitle('test');
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.pause(1000);
            // 3. Verify that content is invalid, because the second required input is empty:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('article_wizard_1');
            assert.ok(result, "Article content should be invalid because required body text area is empty");
        });

    // Verifies: Incorrect behaviour of validation when two required text inputs/ text area/ text line are present in the wizard #2616
    // https://github.com/enonic/app-contentstudio/issues/2616
    it("GIVEN wizard for new 'article' is opened WHEN article's title and display name are filled in AND Save button has been pressed THEN the content should be invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let articleForm = new ArticleForm();
            // 1. Open new wizard for article-content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            let displayName = contentBuilder.generateRandomName('article');
            // 2. Fill in the first required input:
            await articleForm.typeArticleTitle('test');
            await contentWizard.typeDisplayName(displayName);
            // 3. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(2000);
            // 4. Verify that content is invalid, because the second required input is empty:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('article_wizard_2');
            assert.ok(result, "Article content should be invalid because required body text area is empty");
        });

    // Verifies: Incorrect behaviour of validation when two required text inputs/ text area/ text line are present in the wizard #2616
    // https://github.com/enonic/app-contentstudio/issues/2616
    it("GIVEN wizard for new 'article' is opened WHEN both required inputs are filled in AND 'Save' button has been pressed THEN the content should be valid",
        async () => {
            let contentWizard = new ContentWizard();
            let articleForm = new ArticleForm();
            // 1. Open new wizard for article-content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            let displayName = contentBuilder.generateRandomName('article');
            // 2. Fill in the first required input:
            await articleForm.typeArticleTitle('test');
            // 2. Fill in the second required input:
            await articleForm.typeInTextArea('body text');
            await contentWizard.typeDisplayName(displayName);
            // 3. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(2000);
            // 4. Verify that content is not valid, because the second required input is empty:
            let isInvalid = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('article_wizard_3');
            assert.ok(isInvalid === false, 'Article content should be valid because required inputs are filled');
        });

    // TODO add tests for Open Saga button:
    it(`GIVEN 'option 1' is selected in the single selector WHEN help text icon has been clicked THEN expected help text get visible`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new option set:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET_HELP_TEXT);
            let optionSetHelpFormView = new OptionSetHelpFormView();
            // 2. Select 'option 1' in the single-selector:
            await singleSelectionOptionSet.selectOption('option 1');
            // 3. Click on Show help text toggler in the wizard-toolbar and show the text:
            await contentWizard.clickOnHelpTextsToggler();
            // 4. Verify that expected help text gets visible inside the selected option:
            let textOption1 = await optionSetHelpFormView.getHelpText('Ingress1');
            await studioUtils.saveScreenshot('option_1_help_text');
            assert.equal(textOption1, 'Help text 3', 'Expected help text should be displayed');
            // 5. Reset the option in single-selector:
            await singleSelectionOptionSet.expandOptionSetMenuAndClickOnMenuItem(0, 'Reset');
            // 6. Select 'option 2'
            await singleSelectionOptionSet.selectOption('option 2');
            // 8. Verify that help text is updated:
            let textOption2 = await optionSetHelpFormView.getHelpText('Ingress2');
            await studioUtils.saveScreenshot('option_2_help_text');
            assert.equal(textOption2, 'Help text 4', 'Expected help text should be displayed');
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
