/**
 * Created on 11.06.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const appConst = require('../../libs/app_const');

describe('Child content , edit.permissions.dialog.spec: ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    const INITIAL_NUMBER_OF_SELECTED_ITEMS = 7;

    // Verify - Copy from project button should be disabled when no changes in entries #8837
    // https://github.com/enonic/app-contentstudio/issues/8837
    it(`GIVEN existing root-folder is selected WHEN 'General Step' of Edit Permissions dialog has been opened THEN expected elements should be displayed in the step`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = appConst.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName);
            CHILD_FOLDER = contentBuilder.buildFolder(appConst.generateRandomName('child'));
            // 1. Select the folder and open Details Panel:
            await studioUtils.doAddFolder(PARENT_FOLDER);
            // 1. Select a folder and add a child folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog()
            // 3. 'Copy from parent' is shown for the top level items
            // TODO uncomment it when the #8837 will be fixed:
            //await editPermissionsGeneralStep.waitForCopyFromParentButtonDisabled();
            // 4. Verify that 'Next' button is enabled, 'Reset' button is disabled, 'Copy from parent' button is disabled,
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
            await editPermissionsGeneralStep.waitForResetButtonDisabled();
            // 5. Verify that 'Public' radio is selected by default:
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected, `'Public' radio should be selected by default`);
            // 6. 'Restricted' radio should be displayed
            await editPermissionsGeneralStep.waitForRestrictedRadioDisplayed();
        });

    it(`GIVEN a permission-entry has been removed in General Step WHEN 'Reset' button has been pressed THEN 'Reset' and 'Copy from project' buttons gets disabled again`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
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
            await editPermissionsGeneralStep.waitForResetButtonEnabled();
            // 5. Verify that the number of selected items is reduced by one
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, 6, 'The number of selected items should be 6 after removing one item');
            // 6. Click on 'Reset' button
            await editPermissionsGeneralStep.waitForResetButtonEnabled();
            await editPermissionsGeneralStep.clickOnResetButton();
            // 7. Verify that 'Reset' and 'Copy from project' buttons are disabled now:
            await editPermissionsGeneralStep.waitForResetButtonDisabled();
            await editPermissionsGeneralStep.waitForCopyFromParentButtonDisabled();
            // 8. Verify that the initial number of selected items is restored:
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                'Initial entries should be restored after clicking on Reset button');
        });

    it(`GIVEN a permission-entry has been removed in General Step WHEN 'Copy from project' button has been pressed THEN 'Reset' and 'Copy from project' buttons gets disabled again`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
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
            await editPermissionsGeneralStep.waitForResetButtonEnabled();
            // 5. Verify that the number of selected items is reduced by one
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, 6, 'The number of selected items should be 6 after removing one item');
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 6. Click on 'Copy from parent' button:
            await editPermissionsGeneralStep.clickOnCopyFromParentButton();
            // 7. Verify that 'Reset' and 'Copy from parent' buttons get disabled now:
            await editPermissionsGeneralStep.waitForResetButtonDisabled();
            await editPermissionsGeneralStep.waitForCopyFromParentButtonDisabled();
            // 8. Verify that the initial number of selected principals is restored:
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                'Initial entries should be restored after clicking on Reset button');
        });

    // Principal selector doesn't include the "Everyone" principal
    it(`GIVEN General Step of Edit Permissions dialog has been opened WHEN 'Everyone' text has been inserted in the filter input THEN 'No matching items' message should appear`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.doFilterOptionsInSelector('Everyone');
            await editPermissionsGeneralStep.waitForEmptyOptionsMessage();
        });

    it(`GIVEN child folder - 'Restricted' radio button has been pressed WHEN 'Reset' button has been clicked THEN 'Public' radio gets selected again`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Click on Restricted radio button:
            await editPermissionsGeneralStep.clickOnRestrictedRadioButton();
            // 4. Verify that 'Copy from parent' button gets enabled:
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 5. Click on 'Reset' button:
            await editPermissionsGeneralStep.clickOnResetButton();
            // 6. Verify that Public radio button is selected again:
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected, `'Public' radio should be selected after click on Reset button`);
            // 7. Verify that 'Next' button remains enabled:
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
        });

    it(`GIVEN child folder - 'Restricted' radio button has been pressed WHEN 'Next' button has been clicked THEN 'Apply changes' button should be enabled`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
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
            assert.strictEqual(message, appConst.NOTIFICATION_MESSAGES.permissionsAppliedNotificationMessage(CHILD_FOLDER.displayName),
                `'Permissions applied' - message should appears`);
        });

    it(`GIVEN child folder - with selected 'Restricted' radio WHEN Edit permission dialog has been opened THEN 'Copy from parent' button should be enabled AND 'Restricted' radio should be selected`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Verify that 'Copy from parent' button is enabled:
            await editPermissionsGeneralStep.waitForCopyFromParentButtonEnabled();
            // 4. Verify that 'Restricted' radio is selected:
            let isSelected = await editPermissionsGeneralStep.isRestrictedRadioSelected();
            assert.ok(isSelected, `'Restricted' radio should be selected.`);

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
