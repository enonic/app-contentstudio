/**
 * Created on 07.07.2025
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
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');


describe(`Summary step - tests for changed list, access.control.changed.list.spec: `,
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        if (typeof browser === 'undefined') {
            webDriverHelper.setupBrowser();
        }

        let PARENT_FOLDER_NAME = appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME;

        it(`GIVEN parent folder(13 child items) is selected WHEN 'this item and all children' AND 'Replace' radio have been clicked THEN 14 items should be displayed in the Replace all permissions button`,
            async () => {
                let userAccessWidget = new UserAccessWidget();
                let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
                let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
                // 1. Select the parent folder :
                await studioUtils.findAndSelectItem(PARENT_FOLDER_NAME);
                await studioUtils.openBrowseDetailsPanel();
                // 2. Click on 'Edit Permissions' link and open the modal dialog:
                await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
                // 3. Add 'Audit Log' principal:
                await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.AUDIT_LOG);
                // 4. Click on 'Next' button and go to Apply Changes step:
                await editPermissionsGeneralStep.clickOnNextButton();
                await editPermissionsChooseApplyChangesStep.waitForLoaded();
                // 5. Click on 'This item and all children' radio button:
                await editPermissionsChooseApplyChangesStep.clickOnThisItemAndChildrenRadioButton();
                // 6. Click on 'Replace existing child permissions'
                await editPermissionsChooseApplyChangesStep.clickOnReplaceExistingChildPermissionsCheckbox();
                // 7. Click on 'Yes' in the confirmation dialog:
                let confirmationDialog = new ConfirmationDialog();
                await confirmationDialog.waitForDialogOpened();
                await confirmationDialog.clickOnConfirmButton();
                // 8. Click on 'Next' button:
                await editPermissionsChooseApplyChangesStep.clickOnNextButton();
                // 9. Verify the data in Summary step:
                let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
                await editPermissionsSummaryStep.waitForLoaded();
                let items= await editPermissionsSummaryStep.getChangedItemsList();
                assert.equal(items.length, 8, "Changed items list should contain 8 items");
                let number = await editPermissionsSummaryStep.getNumberFromReplaceAllPermissionsButton();
                assert.equal(number, 14, "Permissions will be replaced(updated) for 14 content items");
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
