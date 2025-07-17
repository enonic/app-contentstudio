/**
 * Created on 16.01.2018. updated on 04.06.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const appConst = require('../../libs/app_const');

describe('Folder in root directory, General step, edit.permissions.dialog.spec ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER;
    const INITIAL_NUMBER_OF_SELECTED_ITEMS = 7;

    // Verify - Copy from project button should be disabled when no changes in entries #8837
    // https://github.com/enonic/app-contentstudio/issues/8837
    it(`GIVEN existing root-folder is selected WHEN 'General Step' of Edit Permissions dialog has been opened THEN expected elements should be displayed in the step`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Select the folder and open Details Panel:
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog()
            // 3. 'Copy from project' is shown for the top level items (#8837)
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonDisabled();
            // 4. Verify that 'Next' button is enabled, 'Reset' button is disabled, 'Copy from project' button is disabled,
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
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS, '7 selected item should be selected by default');
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 3. Verify - "Copy from project" gets enabled
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonEnabled();
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
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonDisabled();
            // 8. Verify that the initial number of selected items is restored:
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                'Initial entries should be restored after clicking on Reset button');
        });

    it(`GIVEN a permission-entry has been removed in General Step WHEN 'Copy from project' button has been pressed THEN 'Reset' and 'Copy from project' buttons gets disabled again`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = contentBuilder.generateRandomName('folder');
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS, '7 selected item should be selected by default');
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 3. Verify - "Copy from project" gets enabled
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonEnabled();
            // 4. Verify that 'Next' button is enabled, 'Reset' button is enabled
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
            await editPermissionsGeneralStep.waitForResetButtonEnabled();

            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, 6, 'The number of selected items should be 6 after removing one item');
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonEnabled();
            await editPermissionsGeneralStep.clickOnCopyFromProjectButton();
            await editPermissionsGeneralStep.waitForResetButtonDisabled();
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonDisabled();
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                `Initial entries should be restored after clicking on 'Reset' button`);
        });

    // Principal selector doesn't include the "Everyone" principal
    it(`GIVEN General Step of Edit Permissions dialog has been opened WHEN 'Everyone' text has been inserted in the filter input THEN 'No matching items' message should appear`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = contentBuilder.generateRandomName('folder');
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.doFilterOptionsInSelector('Everyone');
            await editPermissionsGeneralStep.waitForEmptyOptionsMessage();
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
