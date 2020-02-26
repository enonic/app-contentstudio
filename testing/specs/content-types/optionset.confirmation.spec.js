/**
 * Created on 24.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const OptionSetForm = require('../../page_objects/wizardpanel/optionset/optionset.form.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/single.selection.option.set.view');

describe('optionset.confirmation.spec: check for `confirmation` when deleting existing or new item-set `', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //New set with dirty fields: confirmation should appear
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should appear`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            //2. Click on the radio button and add new item-set:
            await optionSetForm.clickOnOption1Radio();
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            studioUtils.saveScreenshot('new_item_set_added');
            await singleSelectionOptionSet.typeOptionName("test option");
            //3. Type a text in the second item-set:
            await singleSelectionOptionSet.typeInLabelInput("label1", 1);
            //3. Click on 'remove-icon' and try to close the second item-set:
            await singleSelectionOptionSet.clickOnRemoveItemSetOccurrenceView(1);
            studioUtils.saveScreenshot('item_set_confirmation_dialog');
            //"Confirmation Dialog" should appear, because new item-set with dirty fields:
            await confirmationDialog.waitForDialogOpened();
        });

    // //New set with no dirty fields (ie only default values): no confirmation
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should appear`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            await optionSetForm.clickOnOption1Radio();
            //2. Click on the radio button and add new item-set:
            await singleSelectionOptionSet.clickOnAddItemSetButton();
            await singleSelectionOptionSet.typeOptionName("test option");
            //click on remove-icon(remove the second item-set):
            await singleSelectionOptionSet.clickOnRemoveItemSetOccurrenceView(1);
            studioUtils.saveScreenshot('item_set_no_confirmation_dialog');
            let result = await confirmationDialog.isDialogVisible();
            assert.isFalse(result, "Confirmation Dialog should not be loaded, because new item-set has no dirty fields");
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
            await optionSetForm.clickOnOption1Radio();

            await singleSelectionOptionSet.typeOptionName("test option");
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('item_set_validation1');
            // "Red icon" should not be displayed, because required inputs are filled!
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    it(`GIVEN wizard for new 'option set' is opened WHEN name has been typed AND Save button pressed THEN Saved button should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            let displayName = contentBuilder.generateRandomName('optionset');
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('item_set_saved_button_wizard');
            //"Saved" button should appear in the wizard-toolbar
            await contentWizard.waitForSavedButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
