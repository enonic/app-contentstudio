/**
 * Created on 21.11.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const appConst = require('../libs/app_const');
const EditPermissionsDialog = require('../page_objects/edit.permissions.dialog');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const AccessStepForm = require('../page_objects/wizardpanel/access.wizard.step.form');
const UserAccessWidget = require('../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('wizard.update.permissions.spec: update permissions and check the state of Save button on toolbar',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let displayName = contentBuilder.generateRandomName('folder');
        let newDisplayName = contentBuilder.generateRandomName('folder');

        it(`GIVEN content is saved in wizard WHEN permissions have been changed THEN 'Saved' button should be visible on toolbar`,
            () => {
                let contentWizard = new ContentWizard();
                let accessStepForm = new AccessStepForm();
                let editPermissionsDialog = new EditPermissionsDialog();
                return studioUtils.openContentWizard(appConst.contentTypes.FOLDER).then(() => {
                    return contentWizard.typeDisplayName(displayName);
                }).then(() => {
                    return contentWizard.waitAndClickOnSave();
                }).then(() => {
                    return contentWizard.pause(1000);
                }).then(() => {
                    return accessStepForm.clickOnEditPermissionsButton();
                }).then(() => {
                    //uncheck the 'Inherit permissions'
                    return editPermissionsDialog.clickOnInheritPermissionsCheckBox();
                }).then(() => {
                    // add default permissions for 'Anonymous user'
                    return editPermissionsDialog.filterAndSelectPrincipal(appConstant.systemUsersDisplayName.ANONYMOUS_USER);
                }).then(() => {
                    return editPermissionsDialog.clickOnApplyButton();
                }).then(() => {
                    let expectedMessage = appConstant.permissionsAppliedNotificationMessage(displayName);
                    return contentWizard.waitForExpectedNotificationMessage(expectedMessage);
                }).then(() => {
                    return assert.eventually.isTrue(contentWizard.waitForSavedButtonVisible(),
                        "'Saved' button should be on the wizard-toolbar");
                });
            });

        it(`GIVEN existing content is opened WHEN display name has been changed AND new permissions applied THEN 'Save' button should be visible on wizard-toolbar`,
            () => {
                let contentWizard = new ContentWizard();
                let editPermissionsDialog = new EditPermissionsDialog();
                let accessStepForm = new AccessStepForm();
                return studioUtils.openContentInWizard(displayName).then(() => {
                    return contentWizard.typeDisplayName(newDisplayName);
                }).then(() => {
                    return accessStepForm.clickOnEditPermissionsButton();
                }).then(() => {
                    // add default permissions for 'Everyone'
                    return editPermissionsDialog.filterAndSelectPrincipal(appConstant.systemUsersDisplayName.EVERYONE);
                }).then(() => {
                    return editPermissionsDialog.clickOnApplyButton();
                }).then(() => {
                    let expectedMessage = appConstant.permissionsAppliedNotificationMessage(displayName);
                    return contentWizard.waitForExpectedNotificationMessage(expectedMessage);
                }).then(() => {
                    return assert.eventually.isTrue(contentWizard.waitForSaveButtonEnabled(),
                        "'Save' button should be enabled on the wizard-toolbar");
                });
            });

        it(`GIVEN existing content is opened WHEN permissions for the content have been updated in browse panel (Details Panel) THEN 'Save' button should be disabled in the wizard`,
            () => {
                let editPermissionsDialog = new EditPermissionsDialog();
                let userAccessWidget = new UserAccessWidget();
                let contentWizard = new ContentWizard();
                return studioUtils.openContentInWizard(displayName).then(() => {
                    return studioUtils.doSwitchToContentBrowsePanel();
                }).then(() => {
                    return studioUtils.openBrowseDetailsPanel();
                }).then(() => {
                    return userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
                }).then(() => {
                    // add default permissions for 'Super User'
                    return editPermissionsDialog.filterAndSelectPrincipal(appConstant.systemUsersDisplayName.SUPER_USER);
                }).then(() => {
                    return editPermissionsDialog.clickOnApplyButton();
                }).then(() => {
                    return studioUtils.switchToContentTabWindow(displayName)
                }).then(() => {
                    return assert.eventually.isTrue(contentWizard.waitForSaveButtonVisible(),
                        "'Save' button should be visible and disabled on the wizard-toolbar");
                });
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });