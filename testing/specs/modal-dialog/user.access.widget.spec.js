/**
 * Created on 02.02.2022
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

    it(`Preconditions: new folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`WHEN just created folder is selected THEN expected default principal should be displayed in the user access widget`,
        async () => {
            let detailsWidgetPermissionsSection = new DetailsWidgetPermissionsSection();
            // 1. Select the just created folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. 'Full Access' should be displayed for SU
            let access = await detailsWidgetPermissionsSection.getPrincipalAccess('SU');
            assert.equal(access, appConst.permissions.FULL_ACCESS, `'Full Access' should be displayed for SU`);
            // 3. SU compact name should be displayed in the widget:
            let names = await detailsWidgetPermissionsSection.getPrincipalsCompactName();
            await studioUtils.saveScreenshot('user_access_widget');
            assert.equal(names.length, 1, "one acl entry should be displayed in the widget");
            assert.equal(names[0], 'SU', "SU user should be displayed in the access widget");
            let actualHeader = await detailsWidgetPermissionsSection.getHeader();
            assert.equal(actualHeader, appConst.ACCESS_WIDGET_HEADER.EVERYONE_CAN_READ, `'Everyone can read' this item - should be displayed`);
        });

    it(`WHEN new acl entry has been added in the folder THEN user access widget should be updated`,
        async () => {
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let detailsWidgetPermissionsSection = new DetailsWidgetPermissionsSection();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. Open Edit Permissions dialog:
            await detailsWidgetPermissionsSection.clickOnEditPermissionsButton();
            await editPermissionsGeneralStep.waitForLoaded();
            // 3. Select 'Anonymous User' with the default operation:
            await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsGeneralStep.clickOnNextButton();
            // 4. Click on Apply button and close the dialog:
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            // 5. Verify that 'Can Read' access is displayed for Anonymous User :
            let access = await detailsWidgetPermissionsSection.getPrincipalAccess('AU');
            assert.equal(access, 'Can Read', 'Expected access should be displayed for AU');
            await studioUtils.saveScreenshot('user_access_widget_2');
            // 6. Two entries should be displayed in the widget:
            let names = await detailsWidgetPermissionsSection.getPrincipalsCompactName();
            assert.equal(names.length, 2, "Two principal-items should be present in the widget");
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
