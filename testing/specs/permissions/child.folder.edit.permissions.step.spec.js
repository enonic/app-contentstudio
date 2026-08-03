/**
 * Created on 11.06.2025 updated on 31.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const EditPermissionsChooseApplyChangesStep = require('../../page_objects/permissions/edit.permissions.choose.apply.changes.step');
const appConst = require('../../libs/app_const');
const PublishContentDialog = require('../../page_objects/content.publish.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('Child and parent content, replace existing permissions in child content, child.folder.edit.permissions.spec: ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let IMPORTED_PARENT_FOLDER_NAME = 'folder273049';
    let IMPORTED_CHILD_FOLDER_NAME = 'child865739';
    const INITIAL_NUMBER_OF_SELECTED_ITEMS = 7;

    it(`GIVEN child folder is selected WHEN 'General Step' of Edit Permissions is opened THEN Copy from parent should not be displayed`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 3. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog()
            // 4. 'Copy from parent' is shown for the top level items (issue #8837)
             await editPermissionsGeneralStep.waitForCopyFromParentButtonNotDisplayed();
            // 5. Verify that 'Next' button is enabled, 'Reset' button is disabled, 'Copy from parent' button is disabled,
            await editPermissionsGeneralStep.waitForNextButtonDisabled();
            // 6. Verify that 'Public' radio is selected by default:
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected, `'Public' radio should be selected by default`);
            // 7. 'Restricted' radio should be displayed
            await editPermissionsGeneralStep.waitForRestrictedRadioDisplayed();
            // 8. No changes , so Next is disabled
            await editPermissionsGeneralStep.waitForNextButtonDisabled();
        });

    it(`GIVEN a permission-entry has been removed in General Step WHEN 'Reset' button has been pressed THEN 'Reset' and 'Copy from project' buttons gets disabled again`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS, '7 selected item should be selected by default');
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 3. Verify - 'Copy from parent' gets enabled
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 4. Verify that 'Next' button is enabled, 'Reset' button is enabled as well
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
            // 5. Verify that the number of selected items is reduced by one
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, 6, 'The number of selected items should be 6 after removing one item');
            // 6. Click on 'Copy from parent' button
            await editPermissionsGeneralStep.clickOnCopyFromParentButton();
            // 8. Verify that the initial number of selected items is restored:
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                'Initial entries should be restored after clicking on Reset button');
        });

    it(`GIVEN a permission-entry has been removed in General Step WHEN 'Copy from project' button has been pressed THEN 'Reset' and 'Copy from project' buttons gets disabled again`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS, '7 selected item should be selected by default');
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 3. Verify - "Copy from parent" gets enabled
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 4. Verify that 'Next' button is enabled, 'Reset' button is enabled
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
            // 5. Verify that the number of selected items is reduced by one
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, 6, 'The number of selected items should be 6 after removing one item');
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 6. Click on 'Copy from parent' button:
            await editPermissionsGeneralStep.clickOnCopyFromParentButton();
            // 8. Verify that the initial number of selected principals is restored:
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                'Initial entries should be restored after clicking on Reset button');
        });

    // Principal selector doesn't include the "Everyone" principal
    it(`GIVEN General Step of Edit Permissions dialog has been opened WHEN 'Everyone' text has been inserted in the filter input THEN 'No matching items' message should appear`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.doFilterOptionsInSelector('Everyone');
            await editPermissionsGeneralStep.waitForEmptyOptionsMessage();
        });

    // TODO
    // Copy from parent button is not displayed after switching Access Mode
    // https://github.com/enonic/app-contentstudio/issues/11194
    it.skip(
        `GIVEN child folder - 'Restricted' radio button has been pressed WHEN 'Copy from parent' button has been clicked THEN 'Public' radio gets selected again`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Click on Restricted radio button:
            await editPermissionsGeneralStep.clickOnRestrictedRadioButton();
            // 4. Verify that 'Copy from parent' button gets enabled:
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 5. Click on 'Copy from parent' button:
            await editPermissionsGeneralStep.clickOnCopyFromParentButton();
            // 6. Verify that Public radio button is selected again:
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected, `'Public' radio should be selected after click on Reset button`);
            // 7. Verify that 'Next' button remains enabled:
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
        });

    it(`GIVEN child folder - 'Restricted' radio button has been pressed WHEN 'Next' button has been clicked THEN 'Apply changes' button should be enabled`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Click on 'Restricted' radio button:
            await editPermissionsGeneralStep.clickOnRestrictedRadioButton();
            // 4. Click on 'Next' button:
            await editPermissionsGeneralStep.clickOnNextButton();
            // 6. Verify Summary Step is loaded:
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            await editPermissionsSummaryStep.waitForApplyChangesButtonEnabled();
            // 7. Click on 'Apply Changes' button:
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForDialogClosed();
            // 8. Verify that 'Permissions applied' message appears:
            let message = await userAccessWidget.waitForNotificationMessage();
            assert.strictEqual(message, appConst.NOTIFICATION_MESSAGES.PERMISSIONS_APPLIED,
                `'Permissions applied' - message should appears`);
        });

    it(`GIVEN child folder - with selected 'Restricted' radio WHEN Edit permission dialog has been opened THEN 'Copy from parent' button should be enabled AND 'Restricted' radio should be selected`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Verify that 'Copy from parent' button is enabled:
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 4. Verify that 'Restricted' radio is selected:
            await studioUtils.saveScreenshot('edit_permissions_restricted_radio_selected');
            let isSelected = await editPermissionsGeneralStep.isRestrictedRadioSelected();
            assert.ok(isSelected, `'Restricted' radio should be selected.`);
        });

    it(`Precondition: child folder and its parent - should be published`,
        async () => {
            let publishContentDialog = new PublishContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_FOLDER_NAME);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnMarkAsReadyButton();
            await publishContentDialog.clickOnPublishNowButton();
            await publishContentDialog.waitForDialogClosed();
        });

    it(`GIVEN clicks 'Children Only Radio' Button  and 'Replace All Child Permissions' checkbox have been clicked WHEN 'Cancel' clicked in Confirmation dialog THEN 'Replace child permissions- No'  should be in the summary step`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the parent-folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_PARENT_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.waitForLoaded();
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 3. Go to the second step:
            await editPermissionsGeneralStep.clickOnNextButton();
            // 4. Verify that 'Replace existing child permissions' checkbox is not displayed:
            let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
            await editPermissionsChooseApplyChangesStep.waitForReplaceExistingChildPermissionsCheckboxNotDisplayed();
            // 5. Click on 'Children only' radio button:
            await editPermissionsChooseApplyChangesStep.clickOnChildrenOnlyRadioButton();
            // 6. 'Replace existing child permissions' checkbox gets visible, Check the  checkbox:
            await editPermissionsChooseApplyChangesStep.clickOnReplaceAllChildPermissionsCheckbox();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.waitForDialogOpened();
            // 7. Click on 'Cancel' button in Confirmation dialog:
            await confirmationDialog.clickOnCancelButton();
            await confirmationDialog.waitForDialogClosed();
            // 8. Verify that Replace existing child permissions checkbox is unchecked:
            await studioUtils.saveScreenshot('edit_permissions_replace_existing_child_permissions_unchecked');
            let isChecked = await editPermissionsChooseApplyChangesStep.isReplaceAllChildPermissionsCheckboxChecked();
            assert.ok(isChecked == false, 'Replace existing child permissions checkbox should be unchecked after clicking on No button');
            // 9. Click on 'Next' button:
            await editPermissionsChooseApplyChangesStep.clickOnNextButton();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            await studioUtils.saveScreenshot('edit_permissions_summary_step_after_cancel_confirmation_dialog');
            let accessMode = await editPermissionsSummaryStep.getAccessModeText();
            assert.equal(accessMode, 'Public', 'Public mode should be displayed');
            let applyTo = await editPermissionsSummaryStep.getApplyToText();
            assert.equal(applyTo, 'Children only', 'Children only should be in apply to');
            let replace = await editPermissionsSummaryStep.getReplaceChildPermissionsText();
            assert.equal(replace, 'No', 'Replace child permissions -  No  should be displayed');
            await editPermissionsSummaryStep.waitForRemovedDisplayed('Administrator');
        });

    it(`GIVEN clicks 'Children Only Radio' Button  and 'Replace Existing Child Permissions' have been clicked WHEN Confirm button in Confirmation dialog has been pressed THEN the button should be accordingly updated`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the parent-folder and open Details Panel:
            await studioUtils.findAndSelectItem(IMPORTED_PARENT_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.waitForLoaded();
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 3. Go to the Manage Access step:
            await editPermissionsGeneralStep.clickOnNextButton();
            let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
            // 4. Click on 'Children only' radio button:
            await editPermissionsChooseApplyChangesStep.clickOnChildrenOnlyRadioButton();
            // 5. Check the 'Replace existing child permissions' checkbox:
            await editPermissionsChooseApplyChangesStep.clickOnReplaceAllChildPermissionsCheckbox();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.waitForDialogOpened();
            // 6. Click on 'Yes' button in Confirmation dialog:
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 7. Go to Summary Step:
            await editPermissionsChooseApplyChangesStep.clickOnNextButton();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            // 8. The block with the changes made must be shown by default
            //await editPermissionsSummaryStep.waitForHideNewPermissionsButtonDisplayed();
            //await editPermissionsSummaryStep.clickOnHideNewPermissionsButton();
            // 9. Click on 'Apply Changes' button:
            await editPermissionsSummaryStep.clickOnReplaceAllPermissionsButton();
            // 10. Verify that the parent folder remains with 'Published' status:
            let status = await contentBrowsePanel.getContentStatus(IMPORTED_PARENT_FOLDER_NAME);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, "'Online' status should be in the top version item");
            // 11. Expand the parent folder and verify that the child folder has 'Published' status:
            await contentBrowsePanel.clickOnExpanderIcon(IMPORTED_PARENT_FOLDER_NAME);
            status = await contentBrowsePanel.getContentStatus(IMPORTED_CHILD_FOLDER_NAME);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, "'Online' status should be in the top version item");
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
