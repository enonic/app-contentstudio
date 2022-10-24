/**
 * Created on 11.10.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const EditPermissionsDialog = require('../../page_objects/edit.permissions.dialog');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const PublishContentDialog = require('../../page_objects/content.publish.dialog');

describe('version.items.after.publishing.spec tests for version items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let FOLDER_NAME= appConst.generateRandomName("folder");

    it("Preconditions- published folder should be added",
        async () => {
            let contentWizard = new ContentWizard();
            let publishContentDialog = new PublishContentDialog();
            //1. Open new wizard for folder
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Fill in the name input
            await contentWizard.typeDisplayName(FOLDER_NAME);
            //3. Publish this folder:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.clickOnPublishButton();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnPublishNowButton();
            await publishContentDialog.waitForDialogClosed();
        });

    it(`GIVEN existing published folder is opened WHEN permissions have been updated THEN 'Permissions updated' item should appear in Versions Widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. Select the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await wizardDetailsPanel.openVersionHistory();
            //2. Update permissions:
            await contentWizard.clickOnEditPermissionsButton();
            await editPermissionsDialog.waitForDialogLoaded();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            await editPermissionsDialog.clickOnApplyButton();
            //3. Verify that 'Permissions updated' item appears in the widget
            await wizardVersionsWidget.waitForPermissionsUpdatedItemDisplayed();
            //4. Verify that the total number of items is 4
            let allVersions = await wizardVersionsWidget.countVersionItems();
            assert.equal(allVersions,4,"4 version items should be present in the widget");
            //5. Verify that one 'Published' item is present in the widget
            let publishedItems = await wizardVersionsWidget.countPublishedItems();
            assert.equal(publishedItems,1,"One 'Published' item should be present in the widget");
            //6. Verify that one 'Marked as ready' item is present in the widget
            let markedAsReadyItems = await wizardVersionsWidget.countMarkedAsReadyItems();
            assert.equal(markedAsReadyItems,1,"One 'Marked as Ready' item should be present in the widget");
            //7. Verify that one 'Permissions updated' item is present in the widget
            let permissionsUpdatedItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(permissionsUpdatedItems,1,"One 'Permissions updated' item should be present in the widget");
        });

    it(`GIVEN existing folder with 'Permissions updated' is opened WHEN the folder has been published THEN 'Permissions updated' item should be present in Versions Widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let publishContentDialog = new PublishContentDialog();
            //1. Select the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await wizardDetailsPanel.openVersionHistory();
            //2. Publish the folder:
            await contentWizard.clickOnPublishButton();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnPublishNowButton();
            await publishContentDialog.waitForDialogClosed();
            //3. Verify that 'Permissions updated' item remains visible after the publishing
            await wizardVersionsWidget.waitForPermissionsUpdatedItemDisplayed();
            //4. Verify that the total number of version items is 5 now
            let allVersions = await wizardVersionsWidget.countVersionItems();
            assert.equal(allVersions,5,"Total number of versions should be increased by 1");
            //5. Verify that two 'Published' item is present in the widget
            let publishedItems = await wizardVersionsWidget.countPublishedItems();
            assert.equal(publishedItems,2,"Two Published items should be displayed");
            //6. Verify that one 'Marked as ready' item is present in the widget
            let markedAsReadyItems = await wizardVersionsWidget.countMarkedAsReadyItems();
            assert.equal(markedAsReadyItems,1,"One 'Marked as Ready' item should be present in the widget");
            //7. Verify that one 'Permissions updated' item is present in the widget
            let permissionsUpdatedItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(permissionsUpdatedItems,1,"One 'Permissions updated' item should be present in the widget");

        });
    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
