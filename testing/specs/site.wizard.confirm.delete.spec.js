/**
 * Created on 01.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const appConst = require('../libs/app_const');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');

describe('site.wizard.confirm.delete.spec: opens a site and delete it', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    it(`GIVEN site-wizard is opened AND new site is saved WHEN 'Delete' button has been pressed AND Delete button on the modal dialog pressed THEN 'Confirm delete' dialog appears`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConstant.APP_CONTENT_TYPES]);
            //wizard for new site has been opened and data has been typed:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(SITE.displayName);
            await siteFormPanel.addApplications([appConstant.APP_CONTENT_TYPES]);
            //the site should be automatically saved:
            await contentWizard.waitForNotificationMessage();
            //Click on Archive... button and open Delete Content Dialog:
            await contentWizard.clickOnArchiveButton();
            //Verify that the dialog is loaded:
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForSpinnerNotVisible();
            //Click on 'Delete' button:
            await deleteContentDialog.clickOnDeleteMenuItem();
            await confirmValueDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot("site_wizard_confirm_delete_dialog");

            //Cancel button should be enabled
            await confirmValueDialog.waitForCancelButtonEnabled();
            //'Confirm' button should be disabled, because the number of content is not filled yet.
            await confirmValueDialog.waitForConfirmButtonDisabled();
        });

    it(`GIVEN existing site is opened AND 'Confirm Delete Dialog' has been opened WHEN required number of content has been typed AND 'Confirm' button pressed THEN wizard closes AND the site should be deleted`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Open the site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            //2. Open 'Confirm Content Delete' dialog:
            await contentWizard.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForSpinnerNotVisible();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await confirmValueDialog.waitForDialogOpened();
            //3. Type the required number to delete:
            await confirmValueDialog.typeNumberOrName(2);
            await confirmValueDialog.clickOnConfirmButton();
            await studioUtils.doSwitchToContentBrowsePanel();
            await studioUtils.saveScreenshot("site_wizard_confirm_delete_dialog");
            //the site should not be present in the grid:
            await contentBrowsePanel.waitForContentNotDisplayed(SITE.displayName);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
