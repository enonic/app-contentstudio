/**
 * Created on 20.07.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const userAccessWidget = require('../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const editPermissionsDialog = require('../page_objects/edit.permissions.dialog');
const contentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const accessStepForm = require('../page_objects/wizardpanel/access.wizard.step.form');

describe('edit.permissions.accessselector.spec:  Select `Custom...` permissions and add `Create` operation', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let folder;
    it(`GIVEN 'Edit Permissions' dialog is opened(click on Details Panel) WHEN 'Custom' permissions has been selected AND 'Create' operation has been clicked  AND 'Apply' button pressed THEN correct notification should appear `,
        () => {
            let displayName = contentBuilder.generateRandomName('folder');
            folder = contentBuilder.buildFolder(displayName);
            return studioUtils.doAddFolder(folder).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(folder.displayName);
            }).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                return editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            }).then(() => {
                //Select 'Custom...'
                return editPermissionsDialog.showAceMenuAndSelectItem(appConstant.roleName.CONTENT_MANAGER_APP,
                    appConstant.permissions.CUSTOM);
            }).pause(500).then(() => {
                // Click on 'Create' operation
                studioUtils.saveScreenshot("edit_perm_dlg_custom_permissions");
                return editPermissionsDialog.clickOnPermissionToggle(appConstant.roleName.CONTENT_MANAGER_APP,
                    appConstant.permissionOperation.CREATE);
            }).then(() => {
                return editPermissionsDialog.clickOnApplyButton();
            }).then(() => {
                let message = appConstant.permissionsAppliedNotificationMessage(displayName);
                return expect(contentBrowsePanel.waitForNotificationMessage()).to.eventually.equal(message);
            })
        });

    it(`GIVEN existing folder with 'Custom' permissions is selected WHEN wizard has been opened THEN correct operations should be present in the permissions`,
        () => {
            return studioUtils.openContentInWizard(folder.displayName).then(() => {
                return contentWizardPanel.clickOnAccessTabBarItem();
            }).then(() => {
                return accessStepForm.clickOnEntryRow(appConstant.roleDisplayName.CONTENT_MANAGER_APP);
            }).then(() => {
                studioUtils.saveScreenshot("wizard_permissions_operations");
                return accessStepForm.getPermissionOperations(appConstant.roleDisplayName.CONTENT_MANAGER_APP);
            }).then(result => {
                assert.isTrue(result.length == 2, 'Two operations should be displayed');
                assert.isTrue(result[0] == appConstant.permissionOperation.READ, '`Read` should be displayed');
                assert.isTrue(result[1] == appConstant.permissionOperation.CREATE, '`Create`  is second operation');
            });
        });

    it(`GIVEN existing folder with 'Custom' permissions is selected WHEN wizard has been opened THEN both operations should be allowed by default`,
        () => {
            return studioUtils.openContentInWizard(folder.displayName).then(() => {
                return contentWizardPanel.clickOnAccessTabBarItem();
            }).then(() => {
                return accessStepForm.clickOnEntryRow(appConstant.roleDisplayName.CONTENT_MANAGER_APP);
            }).then(() => {
                return accessStepForm.isOperationAllowed(appConstant.roleDisplayName.CONTENT_MANAGER_APP, 'Read');
            }).then(result => {
                assert.isTrue(result, '`Read` operation should be allowed(green)');
            }).then(() => {
                return accessStepForm.isOperationAllowed(appConstant.roleDisplayName.CONTENT_MANAGER_APP, 'Create');
            }).then((result) => {
                assert.isTrue(result, '`Create` operation should be allowed(green)');
            })
        });

    it(`GIVEN existing folder with 'Custom' permissions AND 'Edit Permissions' dialog is opened WHEN clicked on 'Create' toggle(Content Manager App role) THEN 'Create' operation is getting denied(red)`,
        () => {
            return studioUtils.findAndSelectItem(folder.displayName).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                return editPermissionsDialog.clickOnPermissionToggle(appConstant.roleName.CONTENT_MANAGER_APP,
                    appConstant.permissionOperation.CREATE);
            }).then(() => {
                studioUtils.saveScreenshot("create_operation_is_denied");
                return editPermissionsDialog.isOperationDenied(appConstant.roleName.CONTENT_MANAGER_APP, 'Create');
            }).then(() => {
                return editPermissionsDialog.isOperationAllowed(appConstant.roleName.CONTENT_MANAGER_APP, 'Read');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
