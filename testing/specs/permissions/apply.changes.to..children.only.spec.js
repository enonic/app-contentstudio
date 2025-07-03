/**
 * Created on 19.06.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const EditPermissionsChooseApplyChangesStep = require('../../page_objects/permissions/edit.permissions.choose.apply.changes.step');
const appConst = require('../../libs/app_const');


describe('Child and parent content, apply changes to children content only(do not overwrite), apply.changes.to.children.only.spec: ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;

    it(`GIVEN Restricted radio selected AND new acl entry added in the parent folder AND 'children only' radio has been clicked WHEN 'Apply changes' button has been pressed THEN all changes should be applied to the child content only`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = appConst.generateRandomName('parent');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName);
            CHILD_FOLDER = contentBuilder.buildFolder(appConst.generateRandomName('child'));
            // 1. Select the folder and open Details Panel:
            await studioUtils.doAddFolder(PARENT_FOLDER);
            // 2. Select a folder and add a child folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            await studioUtils.openBrowseDetailsPanel();
            // 3. Parent folder is selected. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 4. Click on 'Restricted' radio button and Add 'Audit Log' principal
            await editPermissionsGeneralStep.clickOnRestrictedRadioButton();
            // 5. Add 'Audit Log' principal:
            await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.AUDIT_LOG);
            // 6. Click on 'Next' button:
            await editPermissionsGeneralStep.clickOnNextButton();
            let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
            // 7. Click on 'Children only' radio button:
            await editPermissionsChooseApplyChangesStep.clickOnChildrenOnlyRadioButton();
            // 8. Do not click on 'Replace existing child permissions' checkbox and click on 'Next'
            await editPermissionsChooseApplyChangesStep.clickOnNextButton();
            // 9. Click on 'Apply Changes' button in Summary step:
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            let number = await editPermissionsSummaryStep.getNumberFromApplyChangesButton();
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForNotificationMessage();
            await editPermissionsSummaryStep.waitForDialogClosed();
            assert.equal(number, 1, "Expected number of changes should be displayed in the button: 1");
        });

    // 'Children only' radio button was selected in the first test, so permissions should not be updated in the parent folder:
    it(`GIVEN select the parent folder AND open Edit Permissions dialog VERIFY that the 'Public' radio button remains selected THEN the Audit Log principal should not be present in the list of principals`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the parent folder and open Edit Permissions general step:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Parent folder is selected. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. 'Public'  radio button remains selected
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected,'Public radio button remains selected because the permissions were applied to the child content only');
            // 4. Audit Log principal should  not be present for the parent folder:
            let result = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.ok(!result.includes(appConst.SYSTEM_ROLES.AUDIT_LOG), 'Audit Log principal should not present in the list of principals');
        });

    //'Children only' radio button was selected in the first test, so permissions should be updated in the child folder only:
    it(`WHEN Edit Permissions dialog for Child folder has been opened THEN the changes from the first test should be applied to the child folder only AND the 'Restricted' radio button is selected AND the 'Audit Log' entry should be present in the list of principals`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the child folder and open Edit Permissions general step:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Parent folder is selected. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await studioUtils.saveScreenshot('perm_children_only_applied');
            // 3. 'Restricted' radio should be selected and  'Audit Log' principal should be present in the list of principals:
            let isSelected = await editPermissionsGeneralStep.isRestrictedRadioSelected();
            assert.ok(isSelected,'Restricted radio button should be selected');
            // 4. Verify that 'Audit Log' principal should be present in the list of principals:
            let result = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.ok(result.includes(appConst.SYSTEM_ROLES.AUDIT_LOG), `'Audit Log' principal should be present in the list of principals`);

            // 5. 'Reset' button should be disabled:
            await editPermissionsGeneralStep.waitForResetButtonDisabled();
            // 6. 'Copy from parent' button should be enabled:
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
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
