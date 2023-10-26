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
const CompareWithPublishedVersionDialog = require('../../page_objects/compare.with.published.version.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('version.items.after.publishing.spec tests for version items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER_NAME = appConst.generateRandomName('folder');

    it('Preconditions- published folder should be added',
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open new wizard for folder
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Fill in the name input
            await contentWizard.typeDisplayName(FOLDER_NAME);
            // 3. Publish this folder:
            await contentWizard.clickOnMarkAsReadyButton();
            await studioUtils.doPublish();
        });

    it(`GIVEN existing published folder is opened WHEN permissions have been updated THEN 'Permissions updated' item should appear in Versions Widget, the content gets Modified`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Select the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            // 2. Update permissions:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            await editPermissionsDialog.clickOnApplyButton();
            // Open version widget:
            await wizardDetailsPanel.openVersionHistory();
            // 3. Verify that 'Permissions updated' item appears in the widget
            await wizardVersionsWidget.waitForPermissionsUpdatedItemDisplayed();
            let actualStatus = await contentWizard.getContentStatus();
            assert.equal(actualStatus, appConst.CONTENT_STATUS.MODIFIED, "the folder gets 'Modified'");
            // 4. Verify that the total number of items is 4
            let allVersions = await wizardVersionsWidget.countVersionItems();
            assert.equal(allVersions, 4, '4 version items should be present in the widget');
            // 5. Verify that one 'Published' item is present in the widget
            let publishedItems = await wizardVersionsWidget.countPublishedItems();
            assert.equal(publishedItems, 1, "One 'Published' item should be present in the widget");
            // 6. Verify that one 'Marked as ready' item is present in the widget
            let markedAsReadyItems = await wizardVersionsWidget.countMarkedAsReadyItems();
            assert.equal(markedAsReadyItems, 1, "One 'Marked as Ready' item should be present in the widget");
            // 7. Verify that one 'Permissions updated' item is present in the widget
            let permissionsUpdatedItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(permissionsUpdatedItems, 1, "One 'Permissions updated' item should be present in the widget");
        });

    it(`WHEN existing folder with updated permissions is selected THEN the folder remains 'Ready for publishing'`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the folder:
            await studioUtils.typeNameInFilterPanel(FOLDER_NAME);
            let state = await contentBrowsePanel.getWorkflowStateByName(FOLDER_NAME);
            // 2. Verify -  folder with updated permissions remains 'Ready for publishing':
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING, "The content should be 'Ready for publishing'");
        });

    it("GIVEN modified folder with updated permissions is opened WHEN 'Show changes' button has been clicked THEN 'inheritPermissions' should be present in 'Compare With Published Version'",
        async () => {
            let contentWizard = new ContentWizard();
            let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
            // 1. Open the modified folder(permissions updated):
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            // 2. Open 'Compare With Published Version' modal dialog
            await contentWizard.clickOnShowChangesToolbarButton();
            await compareWithPublishedVersionDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('compare_dlg_inherit_perm')
            // 3. Verify that inheritPermissions property is false now:
            await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.INHERIT_PERM);
            let value = await compareWithPublishedVersionDialog.getNewValueInModifiedProperty(
                appConst.COMPARE_VERSIONS_DLG_PROP.INHERIT_PERM);
            assert.equal(value, 'false', 'inheritPermissions:false  should be displayed in the dialog');
        });

    it(`GIVEN existing folder with 'Permissions updated' is opened WHEN the folder has been published THEN 'Permissions updated' item should be present in Versions Widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let publishContentDialog = new PublishContentDialog();
            // 1. Select the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await wizardDetailsPanel.openVersionHistory();
            // 2. Publish the folder:
            await contentWizard.clickOnPublishButton();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnPublishNowButton();
            await publishContentDialog.waitForDialogClosed();
            // 3. Verify that 'Permissions updated' item remains visible after the publishing
            await wizardVersionsWidget.waitForPermissionsUpdatedItemDisplayed();
            // 4. Verify that the total number of version items is 5 now
            let allVersions = await wizardVersionsWidget.countVersionItems();
            assert.equal(allVersions, 5, 'Total number of versions should be increased by 1');
            // 5. Verify that two 'Published' item is present in the widget
            let publishedItems = await wizardVersionsWidget.countPublishedItems();
            assert.equal(publishedItems, 2, 'Two Published items should be displayed');
            // 6. Verify that one 'Marked as ready' item is present in the widget
            let markedAsReadyItems = await wizardVersionsWidget.countMarkedAsReadyItems();
            assert.equal(markedAsReadyItems, 1, "One 'Marked as Ready' item should be present in the widget");
            // 7. Verify that one 'Permissions updated' item is present in the widget
            let permissionsUpdatedItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(permissionsUpdatedItems, 1, "One 'Permissions updated' item should be present in the widget");

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
