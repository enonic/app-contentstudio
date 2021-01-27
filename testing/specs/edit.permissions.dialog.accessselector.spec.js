/**
 * Created on 20.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const UserAccessWidget = require('../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsDialog = require('../page_objects/edit.permissions.dialog');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');

describe("edit.permissions.accessselector.spec:  Select 'Custom...' permissions and add 'Create' operation", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let FOLDER;

    it(`Preconditions: a folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`GIVEN 'Edit Permissions' dialog is opened(click on Details Panel) WHEN 'Custom' permissions has been selected AND 'Create' operation has been clicked  AND 'Apply' button pressed THEN correct notification should appear `,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            //2. Open Edit Permissions dialog and uncheck the 'Inherit' checkbox:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            //3. Go to 'Content Manager App' entry and open ACE-menu then select 'Custom...' menu item:
            await editPermissionsDialog.showAceMenuAndSelectItem(appConstant.roleName.CONTENT_MANAGER_APP, appConstant.permissions.CUSTOM);
            await editPermissionsDialog.pause(500);
            //4. Click on 'Create' permission-toggle and allow the operation:
            studioUtils.saveScreenshot("edit_perm_dlg_custom_permissions");
            await editPermissionsDialog.clickOnPermissionToggle(appConstant.roleName.CONTENT_MANAGER_APP,
                appConstant.permissionOperation.CREATE);
            //5. Click on 'Apply' button and close the modal dialog:
            await editPermissionsDialog.clickOnApplyButton();
            //6. Verify the notification message:
            let expectedMessage = appConstant.permissionsAppliedNotificationMessage(FOLDER.displayName);
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, "'Permissions for 'name' are applied.' - Is expected message");
        });

    it(`GIVEN existing folder with 'Custom' permissions is opened WHEN Edit Permissions dialog has been opened THEN expected operations should be allowed`,
        async () => {
            let contentWizardPanel = new ContentWizardPanel();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            //2. Click on Edit Permissions button:
            await contentWizardPanel.clickOnEditPermissionsButton();
            //3. Verify that operations are 'allowed':
            let isAllowed = await editPermissionsDialog.isOperationAllowed(appConstant.roleName.CONTENT_MANAGER_APP, 'Read');
            assert.isTrue(isAllowed, '`Read` operation should be allowed(green)');
            isAllowed = await editPermissionsDialog.isOperationAllowed(appConstant.roleName.CONTENT_MANAGER_APP, 'Create');
            assert.isTrue(isAllowed, "'Create' operation should be allowed(green)");
        });

    it(`GIVEN existing folder is selected AND Edit Permissions dialog is opened WHEN 'Create' toggle has been clicked THEN 'Create' operation gets denied(red)`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            //1. Select the folder and open Edit Permissions dialog:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            //2. Click on permission-toggle:
            await editPermissionsDialog.clickOnPermissionToggle(appConstant.roleName.CONTENT_MANAGER_APP,
                appConstant.permissionOperation.CREATE);
            studioUtils.saveScreenshot("create_operation_is_denied");
            //3. Verify that this operation is denied now:
            await editPermissionsDialog.isOperationDenied(appConstant.roleName.CONTENT_MANAGER_APP, 'Create');
            await editPermissionsDialog.isOperationAllowed(appConstant.roleName.CONTENT_MANAGER_APP, 'Read');
        });

    it(`WHEN folder with updated permissions is selected AND Edit Permissions dialog is opened THEN ACL-entries should be consistently sorted by name`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            //1. Select the folder and open Details Panel
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            //2. Open Edit Permissions dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let entries = await editPermissionsDialog.getNameOfAccessControlEntries();
            //3. Verify the order of ACE:
            assert.equal(entries[0], '/roles/cms.admin', " ACL-entries should be consistently sorted by name");
            assert.equal(entries[1], '/roles/cms.cm.app', " ACL-entries should be consistently sorted by name");
            assert.equal(entries[2], '/roles/system.admin', " ACL-entries should be consistently sorted by name");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
