/**
 * Created on 16.01.2018.
 * verifies : https://github.com/enonic/app-contentstudio/issues/277
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


describe('edit.permissions.dialog.spec:  verifies `app-contentstudio#277`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let folder;
    it(`GIVEN existing folder is selected WHEN Edit Permissions dialog has been opened THEN Inherit permissions checkbox should be selected by default`,
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
                return editPermissionsDialog.isInheritPermissionsCheckBoxSelected();
            }).then(result => {
                assert.isTrue(result, '`Inherit permissions` checkbox should be selected by default');
            }).then(() => {
                return assert.eventually.isFalse(editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected(),
                    "`Overwrite child permissions` checkbox should be not selected");
            });
        });
    //verifies: https://github.com/enonic/app-contentstudio/issues/277  incorrect state of the checkbox, when dialog is closed and reopened again
    it(`GIVEN 'Inherit permissions' checkbox is unselected AND 'Apply' button has been pressed WHEN the modal dialog is reopened THEN checkbox should be not selected`,
        () => {
            return studioUtils.findAndSelectItem(folder.displayName).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                return editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            }).pause(1000).then(() => {
                return assert.eventually.isFalse(editPermissionsDialog.isInheritPermissionsCheckBoxSelected(),
                    "the checkbox is getting unchecked");
            }).then(() => {
                return editPermissionsDialog.clickOnApplyButton();
            }).then(() => {
                return editPermissionsDialog.waitForDialogClosed();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                studioUtils.saveScreenshot("edit_perm_dlg_inherit_checkbox");
                return assert.eventually.isFalse(editPermissionsDialog.isInheritPermissionsCheckBoxSelected(),
                    "the checkbox should be not selected");
            })
        });

    it(`GIVEN existing folder with 'unselected' Inherit permissions checkbox WHEN 'Edit permissions' dialog has been opened THEN 'Inherit permissions' checkbox should be not selected`,
        () => {
            return studioUtils.findAndSelectItem(folder.displayName).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                return assert.eventually.isFalse(editPermissionsDialog.isInheritPermissionsCheckBoxSelected(),
                    "the checkbox should be not selected");
            });
        });

    it(`GIVEN 'Edit Permissions' dialog is opened in 'Details Panel' WHEN 'Overwrite  Permissions' checkbox has been selected AND 'Apply' button pressed AND the dialog is reopened THEN 'Overwrite  Permissions' should not be selected`,
        () => {
            return studioUtils.findAndSelectItem(folder.displayName).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                return editPermissionsDialog.clickOnOverwiteChildPermissionsCheckBox();
            }).pause(1000).then(() => {
                return assert.eventually.isTrue(editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected(),
                    "the checkbox is getting selected");
            }).then(() => {
                return editPermissionsDialog.clickOnApplyButton();
            }).then(() => {
                return editPermissionsDialog.waitForDialogClosed();
            }).then(() => {
                return userAccessWidget.clickOnEditPermissionsLink();
            }).then(() => {
                studioUtils.saveScreenshot("edit_perm_dlg_overwrite_checkbox");
                return assert.eventually.isFalse(editPermissionsDialog.isOverwriteChildPermissionsCheckBoxSelected(),
                    "the checkbox should not be selcted, when the dialog is reopened");
            })
        });
    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
