/**
 * Created on 30.06.2025 updated on 31.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const EditPermissionsChooseApplyChangesStep = require('../../page_objects/permissions/edit.permissions.choose.apply.changes.step');
const appConst = require('../../libs/app_const');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');


describe(`apply.changes.to.children.only.and.replace.spec: apply changes to children content only and click on 'replace all' checkbox: `,
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        if (typeof browser === 'undefined') {
            webDriverHelper.setupBrowser();
        }

        let PARENT_FOLDER_IMPORTED = 'parent498088';
        let CHILD_FOLDER_IMPORTED = 'child431583';

        it(`WHEN Edit Permissions is opened for child folder THEN 'Audit Log' added and 'Restricted' radio has been clicked AND apply changes has been pressed`,
            async () => {
                let userAccessWidget = new DetailsWidgetPermissionsSection();
                let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
                // 2. Select a folder and add a child folder:
                await studioUtils.findAndSelectItem(PARENT_FOLDER_IMPORTED);
                await studioUtils.findAndSelectItem(CHILD_FOLDER_IMPORTED);
                await studioUtils.openBrowseDetailsPanel();
                // 3. Child folder is selected. Click on 'Edit Permissions' link and open the modal dialog:
                await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
                // 4. Click on 'Restricted' radio button and Add 'Audit Log' principal
                await editPermissionsGeneralStep.clickOnRestrictedRadioButton();
                // 5. Add 'Audit Log' principal in the CHILD  folder:
                await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.AUDIT_LOG);
                // 6. Click on 'Next' button:
                await editPermissionsGeneralStep.clickOnNextButton();
                // 7. Click on 'Apply Changes' button in Summary step:
                let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
                await editPermissionsSummaryStep.waitForLoaded();
                await editPermissionsSummaryStep.clickOnApplyChangesButton();
                await editPermissionsSummaryStep.waitForNotificationMessage();
                await editPermissionsSummaryStep.waitForDialogClosed();
            });

        it(`GIVEN permissions have been updated for the parent folder WHEN the "Children only" option is selected and the "Replace All Permissions" button is clicked THEN the permissions should be overwritten in its child folder`,
            async () => {
                let userAccessWidget = new DetailsWidgetPermissionsSection();
                let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
                let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
                // 1. Select the parent folder and open Edit Permissions general step:
                await studioUtils.findAndSelectItem(PARENT_FOLDER_IMPORTED);
                await studioUtils.openBrowseDetailsPanel();
                await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
                // 2. Remove the acl-entry for the parent content:
                await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
                await editPermissionsGeneralStep.clickOnNextButton();
                // 3. Click on 'Children only' radio button:
                await editPermissionsChooseApplyChangesStep.clickOnChildrenOnlyRadioButton();
                // 4. Click on 'Replace existing child permissions'
                await editPermissionsChooseApplyChangesStep.clickOnReplaceAllChildPermissionsCheckbox();
                // 5. Click on 'Yes' in the confirmation dialog:
                let confirmationDialog = new ConfirmationDialog();
                await confirmationDialog.waitForDialogOpened();
                await confirmationDialog.clickOnConfirmButton();
                await editPermissionsChooseApplyChangesStep.clickOnNextButton();
                // 6. Click on 'Replace all permissions' button in Summary step:
                let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
                await editPermissionsSummaryStep.waitForLoaded();
                let number = await editPermissionsSummaryStep.getNumberFromReplaceAllPermissionsButton();
                await editPermissionsSummaryStep.clickOnReplaceAllPermissionsButton();
                await editPermissionsSummaryStep.waitForNotificationMessage();
                await editPermissionsSummaryStep.waitForDialogClosed();
                assert.equal(number, 1, `1 should be displayed in the 'Replace All Permissions' button`);
            });

        it(`WHEN select the child folder AND open Edit Permissions dialog THEN all permissions should be overwritten in the child folder('Administrator' and 'Audit Log' entries should not be displayed)`,
            async () => {
                let userAccessWidget = new DetailsWidgetPermissionsSection();
                let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
                // 1. Select the child folder and open Edit Permissions general step:
                await studioUtils.findAndSelectItem(CHILD_FOLDER_IMPORTED);
                await studioUtils.openBrowseDetailsPanel();
                // 2. Click on 'Edit Permissions' link and open the modal dialog:
                await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
                await studioUtils.saveScreenshot('perm_children_only_overwritten');
                // 3. 'Restricted' radio should be selected and  'Audit Log' principal should be present in the list of principals:
                let isSelected = await editPermissionsGeneralStep.isRestrictedRadioSelected();
                assert.ok(!isSelected, 'Restricted radio button should not be selected');
                // 4. Verify that 'Audit Log' principal should be present in the list of principals:
                let result = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
                assert.ok(!result.includes(appConst.SYSTEM_ROLES.AUDIT_LOG),
                    `'Audit Log' entry should not be present in the list of principals`);
                assert.ok(!result.includes(appConst.SYSTEM_ROLES.ADMINISTRATOR),
                    `'Administrator' entry should not be present in the list of principals`);

                // 6. 'Copy from parent' button should be enabled:
                await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
                await editPermissionsGeneralStep.clickOnCopyFromParentButton();
                result = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
                assert.ok(result.includes(appConst.SYSTEM_ROLES.ADMINISTRATOR),
                    `'Administrator' entry should be present in the list of principals`);
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
