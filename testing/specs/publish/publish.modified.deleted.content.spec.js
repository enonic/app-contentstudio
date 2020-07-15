/**
 * Created on 10.10.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const PublishContentDialog = require('../../page_objects/content.publish.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");

describe('publish.modified.deleted.content.spec - modify 2 published folders, select these folders and check default action`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let FOLDER1;
    let FOLDER2;
    it(`Precondition: 2 'published' folders should be added`,
        async () => {
            let parentFolder = contentBuilder.generateRandomName('folder');
            let childFolder = contentBuilder.generateRandomName('folder');
            FOLDER1 = contentBuilder.buildFolder(parentFolder);
            FOLDER2 = contentBuilder.buildFolder(childFolder);
            await studioUtils.doAddReadyFolder(FOLDER1);
            await studioUtils.doAddReadyFolder(FOLDER2);
            //click on checkboxes and select both folders:
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            //do publish 2 folders:
            await studioUtils.doPublish();
        });

    it(`Precondition: 2 published folders have been updated(state get 'modified')`,
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            //open and modify the first folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER1.displayName);
            await settingsStepForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.hotKeySaveAndCloseWizard();
            //open and modify the second folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER2.displayName);
            await settingsStepForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.hotKeySaveAndCloseWizard();
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/1083
    it(`GIVEN 2 modified folders are selected WHEN folders have been Marked as Deleted THEN default action gets PUBLISH...`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);

            //both folders have been 'marked as deleted':
            await contentBrowsePanel.clickOnDeleteAndMarkAsDeletedAndConfirm(2);
            studioUtils.saveScreenshot("deleted_folders_default_action");
            //default action gets PUBLISH...
            await contentBrowsePanel.waitForDefaultAction(appConstant.PUBLISH_MENU.PUBLISH);
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/1083  - Mark As Ready should not be enabled for deleted content
    it(`GIVEN 2 'Deleted' folders are selected WHEN Publish menu has been expanded THEN 'Mark as Ready' menu item should be disabled`,
        async () => {
            //1. Select two 'Deleted' folders:
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            //2. Click on the dropdown handle and expand the Publish menu.
            await contentBrowsePanel.openPublishMenu();
            studioUtils.saveScreenshot("deleted_folders_publish_menu");
            //3. Mark as Ready menu item should be disabled:
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.MARK_AS_READY);
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/1084 - do not check workflow state for deleted content
    it(`GIVEN 2 'Deleted' folders are selected WHEN Publish Wizard has been opened THEN 'Publish Now' button should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let publishContentDialog = new PublishContentDialog();
            //1. two folders have been checked:
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            //2. Publish Wizard has been opened:
            await contentBrowsePanel.openPublishMenuSelectItem(appConstant.PUBLISH_MENU.PUBLISH);
            studioUtils.saveScreenshot("deleted_folders_publish_dialog");
            // 'Publish Now' button should be enabled, because folders are Deleted:
            await publishContentDialog.waitForPublishNowButtonEnabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
