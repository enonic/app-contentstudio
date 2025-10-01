/**
 * Created on 22.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');
const CompareContentVersionsDialog = require('../../page_objects/compare.content.versions.dialog');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');

describe('folder.content.revert.permissions.spec: tests for reverting of permissions in folder content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const FOLDER_NAME = contentBuilder.generateRandomName('folder');

    it(`Preconditions: test folder should be added`,
        async () => {
            let testFolder = contentBuilder.buildFolder(FOLDER_NAME);
            await studioUtils.doAddFolder(testFolder);
        });

    it(`WHEN new acl-entry has been added in wizard THEN 'Permissions updated' item should appear in the widget`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            // 2. Open Details Panel widget:
            await contentWizard.openContextWindow();
            await wizardContextPanel.openDetailsWidget();
            // 3. Open 'Edit Permissions dialog',  click on 'Access' button in WizardStepNavigatorAndToolbar
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.waitForLoaded();
            // 4. Update the permissions and click on 'Apply Changes' button:
            await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsGeneralStep.clickOnNextButton();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            // 5. click on 'Apply Changes' button in Summary step:
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForDialogClosed();
            let expectedMessage = appConst.NOTIFICATION_MESSAGES.PERMISSIONS_APPLIED;
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, `Permissions for 'contentName' are applied -  Message should appear`);
            // 6. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 7. Verify that the number of version-items with (Revert button) is not changed:
            let result = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot('number_versions_items_permissions_updated');
            assert.equal(result, 4, 'the number of versions items should be increased by 1');

            // 8. Verify that 'Permissions updated' item gets visible in the widget
            let numberItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(numberItems, 1, `One 'Permissions updated'  item should be present in the widget`);

            // 9. Verify 'Compare Version' checkbox in each version item:
            // The checkbox should be visible only for expanded version item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            let isDisplayed = await wizardVersionsWidget.isCompareVersionCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            assert.ok(isDisplayed, "'Compare Version' checkbox should not be displayed for the first item (Created)");

            isDisplayed =
                await wizardVersionsWidget.isCompareVersionCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS_UPDATED, 0);
            assert.ok(isDisplayed === false, "'Compare Version' checkbox should be displayed in the first Permissions updated-item");
            isDisplayed = await wizardVersionsWidget.isCompareVersionCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            assert.ok(isDisplayed === false, "'Compare Version' checkbox should be displayed in the top Edit-item");
        });

    it(`WHEN 'Permissions updated' item has been clicked THEN 'Revert' button should not be visible in the item`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            // 1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 3. Click on 'Permissions updated' item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS_UPDATED, 0);
            await wizardVersionsWidget.pause(500);
            // 4 'Restore'  button should not be displayed in the 'Permission updated' item
            await wizardVersionsWidget.waitForRestoreButtonNotDisplayed();
            // 5. Click on the first Edited item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await studioUtils.saveScreenshot('versions_widget_edited_item_expanded');
            // 6. Verify that Edited-item is expanded and Revert button gets visible:
            await wizardVersionsWidget.waitForRestoreButtonDisplayed();
            // 7. Click on the expanded Edited item and collapse this one:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await studioUtils.saveScreenshot('versions_widget_edited_item_collapsed');
            // 8. Verify that Restore button gets not visible now:
            await wizardVersionsWidget.waitForRestoreButtonNotDisplayed();
        });

    it(`GIVEN existing folder with updated permissions WHEN the previous version has been reverted THEN acl entries should not be updated`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsGeneralStep();
            let userAccessWidget = new UserAccessWidget();
            //1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            //2. open Versions Widget and revert the previous version:
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickOnVersionItemByHeader('Edited', 0);
            await wizardVersionsWidget.clickOnRestoreButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.openDetailsWidget();
            // 3. Open 'Edit Permissions' dialog
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await studioUtils.saveScreenshot('acl_entries_after_reverting');
            // 4. Verify that Anonymous user is present after reverting the previous version:
            let principals = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            // 5. Verify that 'Anonymous User' principal remains visible in the Edit Permissions dialog:
            assert.ok(principals.includes(appConst.systemUsersDisplayName.ANONYMOUS_USER),
                'Permissions should not be updated after the reverting');
        });

    it(`GIVEN existing folder is opened WHEN one more acl-entry has been added THEN the number of 'Permissions updated' items should be increased to 2`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let userAccessWidget = new UserAccessWidget();
            // 1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            let number1 = await wizardVersionsWidget.countVersionItems();
            await contentWizard.openDetailsWidget();
            // 3. Open Edit Permissions dialog,  click on 'Edit Permissions' button in WizardStepNavigatorAndToolbar
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.waitForLoaded();
            // 4. Update the permissions and click on Apply:
            await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsGeneralStep.clickOnNextButton();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            // 5. click on 'Apply Changes' button in Summary step:
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.openVersionsHistoryPanel();
            // 6. Verify that the number of version-items is increased by 1:
            let number2 = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot('number_versions_permissions_updated_2');
            assert.ok(number2 > number1, 'the number of versions should be increased by 1');
            // 7. Verify - 2 items with 'Permissions updated' header are displayed in the widget:
            let numberItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(numberItems, 2, "Two 'Permissions updated'  items should be present in the widget");
        });

    it(`GIVEN existing folder with 2 'updated permissions' is selected AND 'Compare versions' dialog is opened WHEN left dropdown selector has been expanded THEN 2 'Permissions updated' items (icon) should be present in the expanded dropdown list`,
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            // 1. Select the existing folder with updated permissions
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            // 3. Click on the 'Edited' version item:
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 4. Verify that 'Compare changes' checkbox gets visible in the item:
            await browseVersionsWidget.waitForCompareChangesCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 5. Click on 'Compare changes' button in the 'Edited' item:
            await browseVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 6. Click on the 'Permissions Updated' version item:
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS_UPDATED, 1);
            // 7. Verify that 'Compare changes' checkbox gets visible in the item:
            await browseVersionsWidget.waitForCompareChangesCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS_UPDATED, 1);
            // 8. Click on 'Compare changes' button in the 'Permissions Updated' item:
            await browseVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS_UPDATED, 1);
            // 9. Click on 'Compare Versions' button in the Versions Widget:
            await browseVersionsWidget.clickOnCompareVersionsButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 10. Click on the left dropdown handle:
            await compareContentVersionsDialog.clickOnLeftDropdownHandle();
            await studioUtils.saveScreenshot('compare_versions_dlg_changed_options');
            // 11. Verify that 2 options with 'Permissions updated' icon should be present in the dropdown list:
            let result = await compareContentVersionsDialog.getPermissionsUpdatedOptionsInDropdownList();
            assert.equal(result.length, 2, '2 Permissions updated items should be present in the selector options');
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
