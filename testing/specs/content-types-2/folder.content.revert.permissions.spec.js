/**
 * Created on 22.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const EditPermissionsDialog = require('../../page_objects/edit.permissions.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');
const CompareContentVersionsDialog = require('../../page_objects/compare.content.versions.dialog');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

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
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            // 1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            // 2. Open Edit Permissions dialog,  click on 'Access' button in WizardStepNavigatorAndToolbar
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. Uncheck the 'Inherit permissions'
            await editPermissionsDialog.waitForDialogLoaded();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 4. Update the permissions and click on Apply:
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsDialog.clickOnApplyButton();
            let expectedMessage = appConst.permissionsAppliedNotificationMessage(FOLDER_NAME);
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, "Permissions for 'contentName' are applied -  Message should appear");
            // 5. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 6. Verify that the number of version-items with (Revert button) is not changed:
            let result = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot('number_versions_items_permissions_updated');
            assert.equal(result, 3, 'the number of versions items should be increased by 1');

            //7. Verify that 'Permissions updated' item gets visible in the widget
            let numberItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(numberItems, 1, "One 'Permissions updated'  item should be present in the widget");

            //8. Verify 'Show changes' in all version items:
            let isDisplayed = await wizardVersionsWidget.isShowChangesInVersionButtonDisplayed(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            assert.ok(isDisplayed === false, "'Show changes' button should not be displayed for the first item (Created)");

            isDisplayed =
                await wizardVersionsWidget.isShowChangesInVersionButtonDisplayed(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS_UPDATED, 0);
            assert.ok(isDisplayed, "'Show changes' button should be displayed in the first Permissions updated-item");

            isDisplayed = await wizardVersionsWidget.isShowChangesInVersionButtonDisplayed(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            assert.ok(isDisplayed, "'Show changes' button should be displayed in Edit-item");
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
            // 4 'Active version' "Revert" buttons are not displayed in the 'Permission updated' item
            await wizardVersionsWidget.waitForActiveVersionButtonNotDisplayed();
            await wizardVersionsWidget.waitForRevertButtonNotDisplayed();
            // 5. Click on the first Edited item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await studioUtils.saveScreenshot('versions_widget_edited_item_expanded');
            // 6. Verify that Edited-item is expanded and Revert button gets visible:
            await wizardVersionsWidget.waitForRevertButtonDisplayed();
            // 7. Click on the expanded Edited item and collapse this one:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await studioUtils.saveScreenshot('versions_widget_edited_item_collapsed');
            // 8. Verify that Revert button is not visible now:
            await wizardVersionsWidget.waitForRevertButtonNotDisplayed();
        });

    it(`GIVEN existing folder with updated permissions WHEN the previous version has been reverted THEN acl entries should be updated`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            //1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            //2. open Versions Widget and revert the previous version:
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickOnVersionItemByHeader('Edited', 0);
            await wizardVersionsWidget.clickOnRevertButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.openDetailsWidget();
            // 3. Open 'Edit Permissions' dialog
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await studioUtils.saveScreenshot('acl_entries_after_reverting');
            // 4. 'Inherit Permissions' checkbox gets selected:
            let isSelected = await editPermissionsDialog.isInheritPermissionsCheckBoxSelected();
            assert.ok(isSelected, 'The checkbox gets selected again after the reverting');
            // 5. Verify that Anonymous user is present after reverting the previous version:
            let principals = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            // 6. Verify that 'Anonymous User' principal is not present in the permissions dialog:
            assert.ok(principals.includes(appConst.systemUsersDisplayName.ANONYMOUS_USER) === false,
                'Permissions should not be updated after the reverting');
        });

    it(`GIVEN existing folder is opened WHEN one more acl-entry has been added THEN the number of 'Permissions updated' items should be increased to 2`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            let number1 = await wizardVersionsWidget.countVersionItems();
            await contentWizard.openDetailsWidget();
            // 3. Open Edit Permissions dialog,  click on 'Access' button in WizardStepNavigatorAndToolbar
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 4. Update the permissions and click on Apply:
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.SUPER_USER);
            await editPermissionsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.openVersionsHistoryPanel();
            // 5. Verify that the number of version-items is increased by 1:
            let number2 = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot('number_versions_permissions_updated_2');
            assert.ok(number2 > number1, 'the number of versions should be increased by 1');
            // 6. Verify 2 items with 'Permissions updated' header are displayed in the widget:
            let numberItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
            assert.equal(numberItems, 2, "Two 'Permissions updated'  items should be present in the widget");
        });

    it(`GIVEN existing folder with updated permissions is selected AND 'Compare versions' dialog is opened WHEN left dropdown selector has been expanded THEN options with 'Permissions updated' icon should be present in the list`,
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            // 1. Select the existing folder with updated permissions
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            // 3. Click on 'Show changes' button  in the previous edit-item:
            await browseVersionsWidget.clickOnShowChangesButtonByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            await compareContentVersionsDialog.waitForDialogOpened();
            // 4. Click on the left dropdown handle:
            await compareContentVersionsDialog.clickOnLeftDropdownHandle();
            await studioUtils.saveScreenshot('compare_versions_dlg_changed_options');
            // 5. Verify that options with 'Changed' icon should be present in the dropdown list:
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
