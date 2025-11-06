/**
 * Created on 02.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const EditPermissionsDialog = require('../../page_objects/edit.permissions.dialog');
const appConst = require('../../libs/app_const');

describe("user.access.widget.spec:  test for user access widget and Edit Permissions dialog", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let FOLDER;

    it(`Preconditions: new folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`WHEN just created folder is selected THEN expected default principal should be displayed in the user access widget`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            //1. Select the just created folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //2. 'Full Access' should be displayed for SU
            let access = await userAccessWidget.getPrincipalAccess("SU");
            assert.equal(access, "Full Access");
            //3. SU compact name should be displayed in the widget:
            let names = await userAccessWidget.getPrincipalsCompactName();
            await studioUtils.saveScreenshot('user_access_widget');
            assert.ok(names.length >= 1, "acl entries should be displayed in the widget");
            assert.ok(names.includes('SU'), "SU user should be displayed in the access widget");

            let actualHeader = await userAccessWidget.getHeader();
            assert.equal(actualHeader, appConst.ACCESS_WIDGET_HEADER.RESTRICTED_ACCESS, "Restricted access should be displayed");
        });

    it(`WHEN new acl entry has been added in the folder THEN user access widget should be updated`,
        async () => {
            let editPermissionsDialog = new EditPermissionsDialog();
            let userAccessWidget = new UserAccessWidget();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. Open Edit Permissions dialog:
            await userAccessWidget.clickOnEditPermissionsLink();
            await editPermissionsDialog.waitForDialogLoaded();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            // 3. Select 'Anonymous User' with the default operation:
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            // 4. Click on Apply button and close the dialog:
            await editPermissionsDialog.clickOnApplyButton();
            // 5. Verify that 'Can Read' access is displayed for Anonymous User :
            let access = await userAccessWidget.getPrincipalAccess('AU');
            assert.equal(access, 'Can Read', "Expected access should be displayed for AU");
            await studioUtils.saveScreenshot('user_access_widget_2');
            // 6. Two entries should be displayed in the widget:
            let names = await userAccessWidget.getPrincipalsCompactName();
            assert.ok(names.length >= 2, "Two principals should be present in the widget");
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
