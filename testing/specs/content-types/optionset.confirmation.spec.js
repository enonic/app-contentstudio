/**
 * Created on 24.01.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const confirmationDialog = require('../../page_objects/confirmation.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const optionSetForm = require('../../page_objects/wizardpanel/optionset/optionset.form.view');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const singleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/single.selection.option.set.view');


describe('optionset.confirmation.spec: check for `confirmation` when deleting existing or new item-set `', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;

    it(`Preconditions: site should be added`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    //New set with dirty fields: confirmation should appear
    it(`GIVEN 'wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset').then(() => {
                return optionSetForm.clickOnOption1Radio();
            }).then(() => {
                return singleSelectionOptionSet.clickOnAddItemSetButton();
            }).then(() => {
                studioUtils.saveScreenshot('new_item_set_added');
                return singleSelectionOptionSet.typeOptionName("test option");
            }).then(() => {
                return singleSelectionOptionSet.typeItemSetLabel("label1", 1);
            }).pause(300).then(() => {
                return singleSelectionOptionSet.clickOnRemoveItemSetOccurrenceView(1);
            }).then(() => {
                studioUtils.saveScreenshot('item_set_confirmation_dialog');
                return assert.eventually.isTrue(confirmationDialog.waitForDialogVisible(),
                    "Confirmation Dialog should appear, because new item-set with dirty fields");
            });
        });
    // //New set with no dirty fields (ie only default values): no confirmation
    it(`GIVEN wizard for new 'option set' is opened  AND 'Add My Item-set' has been clicked WHEN text typed in the second item-set AND 'remove' item-set button has been pressed THEN 'Confirmation Dialog' should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset').then(() => {
                return optionSetForm.clickOnOption1Radio();
            }).then(() => {
                return singleSelectionOptionSet.clickOnAddItemSetButton();
            }).then(() => {
                return singleSelectionOptionSet.typeOptionName("test option");
            }).pause(300).then(() => {
                return singleSelectionOptionSet.clickOnRemoveItemSetOccurrenceView(1);
            }).then(() => {
                studioUtils.saveScreenshot('item_set_no_confirmation_dialog');
                return assert.eventually.isFalse(confirmationDialog.waitForDialogVisible(),
                    "Confirmation Dialog should not be loaded, because new item-set has no dirty fields");
            });
        });
    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    it(`GIVEN wizard for new 'option set' is opened  AND 'Single Selection' form has been clicked WHEN all required inputs have been filled THEN red icon gets not visible(content is valid)`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset').then(() => {
                let displayName = contentBuilder.generateRandomName('optionset');
                return contentWizard.typeDisplayName(displayName);
            }).then(() => {
                // this content should be saved on this step!!!
                return contentWizard.waitAndClickOnSave();
            }).pause(1000).then(() => {
                return optionSetForm.clickOnOption1Radio();
            }).then(() => {
                return singleSelectionOptionSet.typeOptionName("test option");
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).pause(2000).then(() => {
                return contentWizard.waitUntilInvalidIconDisappears();
            }).then(result => {
                studioUtils.saveScreenshot('item_set_validation1');
                assert.isTrue(result, "Red icon should not be displayed, because required inputs are filled!");
            });
        });
    // verifies: https://github.com/enonic/app-contentstudio/issues/400
    it(`GIVEN wizard for new 'option set' is opened WHEN name has been typed AND Save button pressed THEN Saved button should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset').then(() => {
                let displayName = contentBuilder.generateRandomName('optionset');
                return contentWizard.typeDisplayName(displayName);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).pause(1000).then(() => {
                studioUtils.saveScreenshot('item_set_saved_button_wizard');
                return contentWizard.waitForSavedButtonVisible();
            }).then(result => {
                assert.isTrue(result, "Saved button should appear on the wizard-toolbar");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
