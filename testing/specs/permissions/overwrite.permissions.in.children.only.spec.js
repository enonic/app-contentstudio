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

    let PARENT_FOLDER;
    let CHILD_FOLDER;

    it(`GIVEN permission updated AND children only radio has been clicked WHEN the changes has been applied THEN all changes should be applied to the child content only`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = appConst.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName);
            CHILD_FOLDER = contentBuilder.buildFolder(appConst.generateRandomName('child'));
            // 1. Select the folder and open Details Panel:
            await studioUtils.doAddFolder(PARENT_FOLDER);
            // 2. Select a folder and add a child folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 3. Parent folder is selected. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 4. Click on 'Restricted' radio button and Add 'Audit Log' principal
            await editPermissionsGeneralStep.clickOnRestrictedRadioButton();

            await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.AUDIT_LOG);
            await editPermissionsGeneralStep.clickOnNextButton();

            let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
            // 5. Click on 'Children only' radio button:
            await editPermissionsChooseApplyChangesStep.clickOnChildrenOnlyRadioButton();
            //6. Do not click  on 'Replace existing child permissions' checkbox And click on Next
            await editPermissionsChooseApplyChangesStep.clickOnNextButton();
            // 7. Verify that 'Summary Step' is displayed:
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForNotificationMessage();
            await editPermissionsSummaryStep.waitForDialogClosed();
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
