/**
 * Created on 16.01.2018.
 * verifies : https://github.com/enonic/app-contentstudio/issues/277
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const UserAccessWidget = require('../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsDialog = require('../page_objects/edit.permissions.dialog');

describe('edit.permissions.dialog.spec:  verifies `app-contentstudio#277`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let folder;
    it(`GIVEN existing folder is selected WHEN Edit Permissions dialog has been opened THEN Inherit permissions checkbox should be selected by default`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            folder = contentBuilder.buildFolder(displayName);
            //1. Select the folder and open Details Panel:
            await studioUtils.doAddFolder(folder);
            await studioUtils.findAndSelectItem(folder.displayName);
            await studioUtils.openBrowseDetailsPanel();
            //2. Click on Edit Permissions link:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let result = await editPermissionsDialog.isInheritPermissionsCheckBoxSelected();
            assert.isTrue(result, '`Inherit permissions` checkbox should be selected by default');
            //"Overwrite child permissions" checkbox should be not selected
            let isSelected = await editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected();
            assert.isFalse(isSelected, "Overwrite child permissions checkbox should not be selected");
        });

    //verifies: https://github.com/enonic/app-contentstudio/issues/277  incorrect state of the checkbox, when dialog is closed and reopened again
    it(`GIVEN 'Inherit permissions' checkbox is unselected AND 'Apply' button has been pressed WHEN the modal dialog is reopened THEN checkbox should not be checked`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(folder.displayName);
            await studioUtils.openBrowseDetailsPanel();
            //2. Open 'Edit Permissions' dialog and uncheck 'Inherit Permissions' checkbox:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            let isChecked = await editPermissionsDialog.isInheritPermissionsCheckBoxSelected();
            assert.isFalse(isChecked, "the checkbox gets unchecked");

            studioUtils.saveScreenshot("inherit_perm_is_unchecked");
            //3. Apply and close the modal dialog:
            await editPermissionsDialog.clickOnApplyButton();
            await editPermissionsDialog.waitForDialogClosed();

            //4. Reopen Edit Permissions dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            studioUtils.saveScreenshot("dlg_inherit_checkbox_should_be_unchecked");
            isChecked = await editPermissionsDialog.isInheritPermissionsCheckBoxSelected();
            assert.isFalse(isChecked, "the checkbox should be unchecked");
        });

    it(`GIVEN 'Edit Permissions' dialog is opened WHEN 'Overwrite  Permissions' checkbox has been checked and applied AND the dialog is reopened THEN 'Overwrite  Permissions' should not be selected`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(folder.displayName);
            await studioUtils.openBrowseDetailsPanel();
            //2. Open 'Edit Permissions' dialog and click on 'Overwrite Child Permissions' checkbox:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsDialog.clickOnOverwriteChildPermissionsCheckBox();
            studioUtils.saveScreenshot("overwrite_checkbox_checked");
            let isChecked = await editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected();
            assert.isTrue(isChecked, "Overwrite Child Permissions checkbox gets checked");
            //3. Apply and close the modal dialog:
            await editPermissionsDialog.clickOnApplyButton();
            await editPermissionsDialog.waitForDialogClosed();
            //4. Reopen Edit Permissions dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            studioUtils.saveScreenshot("edit_perm_dlg_overwrite_checkbox");
            // "Overwrite Child' checkbox should not be selected, when the dialog is reopened
            isChecked = await editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected();
            assert.isFalse(isChecked, "Overwrite Child checkbox should be unchecked");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
