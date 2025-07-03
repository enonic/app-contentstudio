/**
 * Created on 20.07.2018. updated on 01.07.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe("edit.permissions.access.selector.spec:  Select 'Custom...' permissions and remove 'Create' operation", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER;
    const ROLE_NAME = appConst.roleName.CM_ADMIN;

    it(`Preconditions: new folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });


    it(`GIVEN 'Edit Permissions' dialog is opened WHEN 'Custom' permissions has been selected for CM_Admin AND 'Create' operation has been switched off AND 'Apply' button pressed THEN expected notification should appear `,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Open Edit Permissions dialog and uncheck the 'Inherit' checkbox:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            //await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 3. Go to 'Content Manager App' entry and open ACE-menu then select 'Custom...' menu item:
            await editPermissionsGeneralStep.showAceMenuAndSelectItem(ROLE_NAME, appConst.permissions.CUSTOM);
            await editPermissionsGeneralStep.pause(500);
            // 4. Click on 'Create' permission-toggle and deny the Create operation:
            await studioUtils.saveScreenshot('edit_perm_dlg_custom_permissions');
            await editPermissionsGeneralStep.clickOnPermissionToggle(ROLE_NAME, appConst.permissionOperation.CREATE);
            // 5. Click on 'Apply Changes' button and close the modal dialog:
            await editPermissionsGeneralStep.clickOnNextButton();
            await editPermissionsSummaryStep.waitForLoaded();
            await editPermissionsSummaryStep.clickOnApplyChangesButton();

            // 6. Verify the notification message:
            let expectedMessage = appConst.permissionsAppliedNotificationMessage(FOLDER.displayName);
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, "'Permissions for 'name' are applied.' - Is expected message");
        });

    it(`GIVEN existing folder with 'Custom' permissions is opened WHEN 'Edit Permissions dialog' has been opened THEN expected operations should be allowed`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            // 2. Click on Edit Permissions button:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Verify that operations are 'allowed':
            let isAllowed = await editPermissionsGeneralStep.isOperationAllowed(ROLE_NAME, 'Read');
            assert.ok(isAllowed, "'Read' operation should be blue (allowed)");
            isAllowed = await editPermissionsGeneralStep.isOperationAllowed(ROLE_NAME, 'Create');
            assert.ok(!isAllowed, "'Create' operation should be white white (not be allowed)");
        });

    it.skip(`WHEN folder with updated permissions is selected AND Edit Permissions dialog is opened THEN ACL-entries should be consistently sorted by name`,
        async () => {
            let editPermissionsDialog = new EditPermissionsGeneralStep();
            let userAccessWidget = new UserAccessWidget();
            // 1. Select the folder and open Details Panel
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Open Edit Permissions dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let entries = await editPermissionsDialog.getNameOfAccessControlEntries();
            // 3. Verify the order of ACE:
            assert.equal(entries[0], '/roles/cms.admin', " ACL-entries should be consistently sorted by name");
            assert.equal(entries[1], '/roles/cms.cm.app', " ACL-entries should be consistently sorted by name");
            assert.equal(entries[2], '/roles/system.admin', " ACL-entries should be consistently sorted by name");
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
