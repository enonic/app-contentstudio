/**
 * Created on 21.11.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const appConst = require('../libs/app_const');
const EditPermissionsDialog = require('../page_objects/edit.permissions.dialog');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const UserAccessWidget = require('../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('wizard.update.permissions.spec: update permissions and check the state of Save button on toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = contentBuilder.generateRandomName('folder');
    const DISPLAY_NAME_1 = contentBuilder.generateRandomName('folder');
    const newDisplayName = contentBuilder.generateRandomName('folder');

    // Verify - https://github.com/enonic/app-contentstudio/issues/5172
    // Content Wizard has incorrect state after data changes followed by permissions update #5172
    // Path is cleared after updating permissions in new unsaved content #5407
    it(`GIVEN wizard for folder is opened AND name input is filled in WHEN permissions have been updated THEN path input should not be cleared`,
        async () => {
            let folderName = appConst.generateRandomName('folder');
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Open new folder-wizard,
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Fill in the name input:
            await contentWizard.typeDisplayName(folderName);
            // 3. Open 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 4. Uncheck Inherit Permissions checkbox and apply it:
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            await editPermissionsDialog.clickOnApplyButton();
            await editPermissionsDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot("unsaved_folder_permissions_updated");
            await editPermissionsDialog.waitForNotificationMessage();
            // 5. Verify that path input is not empty after updating permissions:
            let result = await contentWizard.getPath();
            assert.equal(result, folderName, "Expected folder-name should be present in the path input");
        });

    it(`GIVEN wizard for folder is opened WHEN 'Edit Permissions' dialog has been opened THEN Apply button should be disabled`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Open new folder-wizard,
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Open 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Apply button should be disabled:
            await editPermissionsDialog.waitForApplyButtonDisabled();
            // 4. "Overwrite child permissions" checkbox should not be selected
            let isSelected = await editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected();
            assert.ok(isSelected === false, "'Overwrite child permissions' checkbox should not be selected");
        });

    it(`GIVEN wizard for folder is opened WHEN 'Edit Permissions' dialog has been opened THEN three default permissions should be present in the dialog`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Open new folder-wizard,
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Open 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Verify the default acl-entries:
            let principals = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.equal(principals.length, 3, "Three 'acl entry' should be present in the new wizard by default");
            // 4. Verify that access selectors are disabled
            await editPermissionsDialog.waitForAccessSelectorDisabled(appConst.SYSTEM_ROLES.CM_APP);
            await editPermissionsDialog.waitForAccessSelectorDisabled(appConst.SYSTEM_ROLES.ADMINISTRATOR);
            await editPermissionsDialog.waitForAccessSelectorDisabled(appConst.SYSTEM_ROLES.CM_ADMIN);
            // 5. Uncheck the 'Inherit permissions' checkbox
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 6. Verify that access selectors get enabled after unselecting the 'Inherit permissions' checkbox
            await editPermissionsDialog.waitForAccessSelectorEnabled(appConst.SYSTEM_ROLES.CM_APP);
            await editPermissionsDialog.waitForAccessSelectorEnabled(appConst.SYSTEM_ROLES.ADMINISTRATOR);
            await editPermissionsDialog.waitForAccessSelectorEnabled(appConst.SYSTEM_ROLES.CM_ADMIN);
            // 7. 'Apply' button gets enabled, because 'Inherit permissions' is unselected:
            await editPermissionsDialog.waitForApplyButtonEnabled();
        });

    // Verifies: https://github.com/enonic/xp/issues/4752
    // Edit Permissions Dialog shows incorrect content name #4752
    it(`GIVEN wizard for folder is opened WHEN display name has been typed THEN the content path should be updated in the Edit Permissions dialog `,
        async () => {
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Open new folder-wizard, and open Edit Permissions dialog
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 2. Verify the content path in the modal dialog:
            let actualPath1 = await editPermissionsDialog.getContentPath();
            assert.ok(actualPath1.includes('unnamed'));
            // 3. Close the modal dialog
            await editPermissionsDialog.clickOnCancelButton();
            await editPermissionsDialog.waitForDialogClosed();
            // 4. Fill in the display name input:
            await contentWizard.typeDisplayName(DISPLAY_NAME_1);
            // 5. Save the display name:
            await contentWizard.waitAndClickOnSave();
            // 6. reopen 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsDialog.waitForDialogLoaded();
            // 7. Verify that the path is updated
            let actualPath2 = await editPermissionsDialog.getContentPath();
            assert.ok(actualPath2.includes(DISPLAY_NAME_1), "Content path should be updated int he modal dialog");

        });

    it(`GIVEN new folder wizard is opened and the folder is saved WHEN permissions have been updated THEN 'Saved' button remains visible after applying the permissions`,
        async () => {
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Open new folder-wizard, fill in the name input and save it:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            // 2. Save the folder:
            await contentWizard.waitAndClickOnSave();
            // 3. Open 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 4. Uncheck the 'Inherit permissions'
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 5.  Add default permissions for 'Anonymous user' and click on Apply button:
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsDialog.clickOnApplyButton();
            let expectedMessage = appConst.permissionsAppliedNotificationMessage(DISPLAY_NAME);
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
            // 6. Verify that 'Saved' button remains visible after applying the permissions:
            await contentWizard.waitForSavedButtonVisible();
        });

    it(`GIVEN existing folder is opened WHEN display name has been changed AND new permissions applied THEN 'Save' button gets enabled in the wizard-toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 1. Update the display name:
            await contentWizard.typeDisplayName(newDisplayName);
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 2. Update permissions(add default permissions for 'Everyone')
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.EVERYONE);
            await editPermissionsDialog.clickOnApplyButton();
            // 3. Check the notification message:
            let expectedMessage = appConst.permissionsAppliedNotificationMessage(DISPLAY_NAME);
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
            // 4.'Save' button gets enabled in the wizard-toolbar:
            await contentWizard.waitForSaveButtonEnabled();
        });

    it(`GIVEN existing content is opened WHEN folder's permissions have been updated in browse panel (Details Panel) THEN 'Save(Disabled)' button should still be present after applying permissions in the grid`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            let contentWizard = new ContentWizard();
            // 1. Select and open the folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Go to browse-panel and add default permissions for 'Super User'
            await studioUtils.doSwitchToContentBrowsePanel();
            await studioUtils.openBrowseDetailsPanel();
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.SUPER_USER);
            await editPermissionsDialog.clickOnApplyButton();
            // 3. Go to the wizard:
            await studioUtils.switchToContentTabWindow(DISPLAY_NAME);
            // 'Save(Disabled)' button should still be present after applying permissions in browse-panel:
            await contentWizard.waitForSaveButtonVisible();
            await contentWizard.waitForSaveButtonDisabled();
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
