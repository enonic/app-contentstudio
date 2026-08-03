/**
 * Created on 27.01.2022 updated on 08.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require('../../libs/content.builder');
const WizardVersionsWidget = require("../../page_objects/wizardpanel/details/wizard.versions.widget");
const ContentWizard = require("../../page_objects/wizardpanel/content.wizard.panel");
const CompareContentVersionsDialog = require("../../page_objects/compare.content.versions.dialog");
const ConfirmationDialog = require("../../page_objects/confirmation.dialog");
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const DetailsWidgetContentSection = require("../../page_objects/details_panel/details.widget.content.section");

describe('move.child.content.spec: Move a child content to another location then delete the parent folder', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    let FOLDER;

    it(`Preconditions: three folders should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName1 = appConst.generateRandomName('parent');
            let displayName2 = appConst.generateRandomName('child');
            let displayName3 = appConst.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName1);
            CHILD_FOLDER = contentBuilder.buildFolder(displayName2);
            FOLDER = contentBuilder.buildFolder(displayName3);
            // 1. Add parent folder
            await studioUtils.doAddFolder(PARENT_FOLDER);
            // 2. Add a child folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 3. Add one more folder in the root directory
            await studioUtils.doAddFolder(CHILD_FOLDER);
            await contentBrowsePanel.pause(400);
            // 4. Unselect the parent folder and add one more folder in the root directory:
            await contentBrowsePanel.clickOnRowByDisplayName(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`GIVEN Move dialog is opened WHEN 'remove selected option' has been clicked THEN 'Move' button gets disabled`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the child folder:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            // 2. Open 'Move' dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Select a folder in the combobox:
            await moveContentDialog.typeTextAndClickOnOption(FOLDER.displayName);
            // 4. Click on 'Remove' icon:
            await moveContentDialog.clickOnRemoveOptionIcon();
            // 5. Verify that Move button gets disabled:
            await moveContentDialog.waitForMoveButtonDisabled();
        });

    // Verifies:  https://github.com/enonic/app-contentstudio/issues/10443
    it(`GIVEN child folder has been moved to another folder WHEN parent has been deleted THEN moved folder should not be deleted`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the child folder:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            // 2. Open 'Move' dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Move the child folder to another folder:
            await moveContentDialog.typeTextAndClickOnOption(FOLDER.displayName);
            await moveContentDialog.clickOnMoveButton();
            await moveContentDialog.waitForClosed();
            // 4. Delete the parent folder
            await studioUtils.doDeleteContent(PARENT_FOLDER.displayName);
            // 5. Verify that moved folder was not deleted:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
        });

    it(`GIVEN Edited and Moved items have been checked in the Versions Widget WHEN 'Compare Content Versions Dialog' has been opened THEN left revert menu buttons should be enabled`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            // 1. open the existing moved content:
            await studioUtils.selectAndOpenContentInWizard(CHILD_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 3. Click on the Edited-0 checkbox
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);

            let expectedNewPath =  "/"+ FOLDER.displayName + "/" + CHILD_FOLDER.displayName;
            // 4. Click on Moved-0 checkbox
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.MOVED, 0);
            // 5. Open Compare versions dialog:
            await wizardVersionsWidget.clickOnShowChangesButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('moved_version_item_compare_versions');
            // 6. Verify the changes:
            let actualPath =  await compareContentVersionsDialog.getPathProperty();
            assert.equal(actualPath,expectedNewPath, `Expected path should be displayed in the 'Compare Content Versions' dialog`);
            await studioUtils.saveScreenshot('moved_version_item_compare_versions');
        });

    it(`WHEN the folder has been published THEN the folder should be Online`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select  the content
            await studioUtils.findContentAndClickCheckBox(CHILD_FOLDER.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
        });

    it(`GIVEN existing child content has been selected WHEN 'Move' button has been pressed THEN Confirmation dialog should not be loaded`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();

            // 1. Select  the content
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            // 2. Move the content to '/'
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            await moveContentDialog.clickOnDropdownHandle();
            await moveContentDialog.clickOnOptionInDropdown('Project root');
            await moveContentDialog.clickOnMoveButton();
            await moveContentDialog.waitForClosed();
            await contentBrowsePanel.pause(1000);

            let status = await contentBrowsePanel.getContentStatus(CHILD_FOLDER.displayName);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, "'Online' status should be in the top version item");

            // TODO selection lost after moving the content:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(CHILD_FOLDER.displayName);
            let contentSection = new DetailsWidgetContentSection();
            await contentSection.waitForDisplayed();
            await studioUtils.saveScreenshot('moved_content_details_widget');
            let  result =  await contentSection.getStatusText();
            assert.equal(result, appConst.CONTENT_STATUS.ONLINE_MOVED, 'Online Moved status should be displayed');

            result =  await contentSection.getWorkflowOrValidityStatus();
            assert.equal(result, 'Ready for publishing', 'Ready for publishing workflow icon should be displayed for the content');


        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
