/**
 * Created on 02.02.2022 updated on 02.03.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const appConst = require('../../libs/app_const');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');

describe('user.access.widget.spec:  test for user access widget and Edit Permissions dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER;
    let USER_CAN_WRITE;
    const USER_COMPACT_NAME = 'WR';

    it(`Precondition 1: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('writer');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP];
            USER_CAN_WRITE = builder.buildUser(userName, appConst.PASSWORD.MEDIUM, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER_CAN_WRITE);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`Preconditions: new folder should be added`,
        async () => {
            await studioUtils.navigateToContentStudioApp();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`WHEN just created folder is selected THEN expected default principal should be displayed in the user access widget`,
        async () => {
            await studioUtils.navigateToContentStudioApp();
            let detailsWidgetPermissionsSection = new DetailsWidgetPermissionsSection();
            // 1. Select the just created folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 3. WR compact name should not be displayed in the widget:
            let names = await detailsWidgetPermissionsSection.getPrincipalsCompactName();
            await studioUtils.saveScreenshot('user_access_widget');
            //assert.equal(names.length, 1, "one acl entry should be displayed in the widget");
            assert.ok(names.includes(USER_COMPACT_NAME)===false,  "WR user should not be displayed in the access widget");
            let actualHeader = await detailsWidgetPermissionsSection.getHeader();
            assert.equal(actualHeader, appConst.ACCESS_WIDGET_HEADER.EVERYONE_CAN_READ,
                `'Everyone can read' this item - should be displayed`);
        });

    it(`WHEN Can Write acl-entry has been added for the folder THEN user access widget should be updated`,
        async () => {
            await studioUtils.navigateToContentStudioApp();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let detailsWidgetPermissionsSection = new DetailsWidgetPermissionsSection();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem('folder41858');//FOLDER.displayName);
            // 2. Open Edit Permissions dialog:
            await detailsWidgetPermissionsSection.clickOnEditPermissionsButton();
            await editPermissionsGeneralStep.waitForLoaded();
            // 3. Select 'Anonymous User' with the default operation:
            await editPermissionsGeneralStep.filterAndSelectPrincipal(USER_CAN_WRITE.displayName);
            await editPermissionsGeneralStep.showAceMenuAndSelectItem(USER_CAN_WRITE.displayName, appConst.permissions.CAN_WRITE);
            await editPermissionsGeneralStep.clickOnNextButton();
            // 4. Click on Apply button and close the dialog:
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await detailsWidgetPermissionsSection.waitForNotificationMessages();
            await editPermissionsSummaryStep.waitForDialogClosed();
            // 5. Verify that 'Can Write' access is displayed for Anonymous User :
            let access = await detailsWidgetPermissionsSection.getPrincipalAccess(USER_COMPACT_NAME);
            assert.equal(access, appConst.permissions.CAN_WRITE, `'Can Write' should be displayed for WR`);
            await studioUtils.saveScreenshot('user_access_widget_2');
            // 6. Two entries should be displayed in the widget:
            //let names = await detailsWidgetPermissionsSection.getPrincipalsCompactName();
            //assert.equal(names.length, 2, "Two principal-items should be present in the widget");
        });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
