/**
 * Created on 15.11.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsDialog = require('../../page_objects/edit.permissions.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('overwrite.permissions.spec: tests for permissions in parent and child content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    const NOTIFICATION_MESSAGE = 'Permissions for 2 items have been applied.';

    it(`Preconditions: parent and child folder should be created with default permissions`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName1);
            CHILD_FOLDER = contentBuilder.buildFolder(displayName2);
            await studioUtils.doAddFolder(PARENT_FOLDER);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
        });

    it(`GIVEN permissions is updated in the child folder WHEN 'Inherit permissions' checkbox has been selected in the child permissions dialog THEN child folder permissions returned to initial state`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            // 1 Select the child folder and click on 'Edit Permissions' link in userAccessWidget
            await openEditPermissionsDialog(CHILD_FOLDER.displayName);
            // 2. click on 'Inherit permissions' checkbox and unselect it, filter options input gets visible now:
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 3. Add 'Can Read' operation for 'Administration Console Login' role
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.ADMIN_CONSOLE);
            // 4. Verify that new permission is added:
            let principals1 = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.ok(principals1.includes(appConst.SYSTEM_ROLES.ADMIN_CONSOLE),
                "'Administration Console Login' role should be present in the dialog");
            // 5. click on 'Inherit permissions' checkbox and select it again
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            await editPermissionsDialog.pause(1000);
            // 6. Verify child folder permissions returned to the initial state:
            let principals2 = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.ok(principals2.includes(appConst.SYSTEM_ROLES.ADMIN_CONSOLE) === false,
                "'Administration Console Login' role should not be present in the dialog");
        });

    // verifies XP-4932 Impossible to save changes when 'Overwrite child permissions' was set to true
    it(`GIVEN parent folder is selected  'Overwrite Child Permissions' checkbox has been clicked AND Apply button pressed WHEN try to close the wizard THEN Alert should not appear`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let contentWizard = new ContentWizard();
            let userAccessWidget = new UserAccessWidget();
            // 1. Open the parent folder and open 'Edit Permissions' dialog
            await studioUtils.selectAndOpenContentInWizard(PARENT_FOLDER.displayName);
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 2. click on 'Overwrite child permissions' checkbox and uncheck it
            await editPermissionsDialog.clickOnOverwriteChildPermissionsCheckBox();
            // 3. Click on 'Apply' button:
            await editPermissionsDialog.clickOnApplyButton();
            // 4. Close the browser tab
            await contentWizard.clickOnCloseBrowserTab();
            // 6. Verify that Alert does not appear in the wizard:
            let result = await contentWizard.isAlertOpen();
            if (result) {
                await contentWizard.dismissAlert();
            }
            assert.ok(result === false, 'Alert should not appear after trying to close the wizard with updated permissions');
        });

    it(`GIVEN 'Edit Permissions' dialog for parent folder is opened WHEN default permissions for 'Anonymous' user has been added THEN correct notification message should appear`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the parent folder and click on  'Edit Permissions' link in userAccessWidget
            await openEditPermissionsDialog(PARENT_FOLDER.displayName);
            // 2. click on 'Inherit permissions' checkbox and uncheck it:
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 3. Access Control combobox gets visible now, add 'Can Read' permissions for Anonymous User:
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsDialog.clickOnApplyButton();
            let result = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(result, NOTIFICATION_MESSAGE, 'Permissions for 2 items are applied.')
        });

    it(`WHEN 'Edit Permissions' dialog is opened in the child folder THEN default permissions for 'Anonymous' user should be inherited from the parent folder`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            // 1 Select the child folder and click on Edit Permissions link in userAccessWidget
            await openEditPermissionsDialog(CHILD_FOLDER.displayName);
            // 2.Verify that the child folder inherits parent's permissions:
            let result = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.ok(result.includes(appConst.systemUsersDisplayName.ANONYMOUS_USER),
                "permissions for `Anonymous User` should be applied from parent folder");
        });

    it(`GIVEN 'Inherit permissions' is unchecked in child folder WHEN permissions for 'Anonymous user' has been removed in parent folder THEN permissions for child should not be updated`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            // 1. Open 'Edit Permissions Dialog' and uncheck  'Inherit Permissions' checkbox
            await clickOnInheritCheckBoxInEditPermissionsDialog(CHILD_FOLDER.displayName);
            // 2. Click on Apply button and close the dialog:
            await editPermissionsDialog.clickOnApplyButton();
            // 3. Select the parent folder and open "Edit Permissions Dialog"
            await openEditPermissionsDialog(PARENT_FOLDER.displayName);
            // 4.Remove 'Anonymous User'- entry in the parent folder
            await editPermissionsDialog.removeAclEntry('users/anonymous');
            // 5. Click on Apply button and close the dialog:
            await editPermissionsDialog.clickOnApplyButton();
            // 6. Select the child folder and open 'Edit permission' dialog
            await openEditPermissionsDialog(CHILD_FOLDER.displayName);
            await studioUtils.saveScreenshot('child_content_overwrite_perm_was_not_checked_1');
            let result = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            // 7. Verify that permissions are not changed in child folder
            assert.ok(result.includes(appConst.systemUsersDisplayName.ANONYMOUS_USER),
                "default permissions for `Anonymous User` should be present for child folder, because 'inherit' checkbox is unchecked");
        });

    // Default merging strategy:
    // if permission is set in parent entry, use the value from the parent entry
    it(`GIVEN 'Inherit permissions' is unchecked in child folder WHEN default permissions for 'Everyone' has been added in parent THEN default permissions for 'Everyone' should  be added in child content as well`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            // 1. Select parent folder:
            await openEditPermissionsDialog(PARENT_FOLDER.displayName);
            // 2. Add default permissions for 'Everyone'
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.EVERYONE);
            // 3. Click on Apply button and close the dialog:
            await editPermissionsDialog.clickOnApplyButton();
            // 4. Select child folder and open 'Edit permission' dialog
            await openEditPermissionsDialog(CHILD_FOLDER.displayName);
            await studioUtils.saveScreenshot("child_content_overwrite_perm_was_not_checked_2");
            let result = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.ok(result.includes(appConst.systemUsersDisplayName.EVERYONE),
                "default permissions for 'Everyone' should  be added in child content as well, because `Default merging strategy` is applied");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

    function clickOnInheritCheckBoxInEditPermissionsDialog(contentName) {
        let editPermissionsDialog = new EditPermissionsDialog();
        return openEditPermissionsDialog(contentName).then(() => {
            return editPermissionsDialog.clickOnInheritPermissionsCheckBox();
        })
    }

    function openEditPermissionsDialog(contentName) {
        let userAccessWidget = new UserAccessWidget();
        return studioUtils.findAndSelectItem(contentName).then(() => {
            return studioUtils.openBrowseDetailsPanel();
        }).then(() => {
            return userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
        })
    }
});
