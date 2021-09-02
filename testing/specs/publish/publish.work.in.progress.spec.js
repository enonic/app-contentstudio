/**
 * Created on 01.02.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');

describe('publish.work.in.progress.spec - publishes work in progress content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let SITE;
    let CONTROLLER_NAME = 'main region';

    it("Precondition - new site should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN 'Work in progress' folder is opened WHEN 'Publish...' menu item has been pressed AND 'Mark as ready' menu item clicked THEN the content gets 'Ready for publishing'",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            //1. Add work in progress folder:
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Expand Publish menu in wizard and select 'Publish...' menu item:
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            //3. Verify that Publish now button is disabled, because this content is work in progress:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            //4. Expand the menu and click on 'Mark as Ready' menu item
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            //5. Verify that Publish Now button gets enabled:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
        });

    //Verifies that 'Confirm Value' dialog with the message "Enter 1 in the field and click Confirm" appears in site wizards:
    it(`GIVEN existing 'work in progress' site has been published in wizard WHEN Unpublish button has been pressed THEN 'Confirm Value' dialog with with '1' number is loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Open an existing site (work in progress)
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            //2. Click on Mark as ready menu item
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            //3. Publish the site:
            await contentPublishDialog.clickOnPublishNowButton();
            //4. Open Unpublish modal dialog:
            let unpublishDialog = await contentWizard.clickOnUnpublishButton();
            await unpublishDialog.clickOnUnpublishButton();
            await confirmValueDialog.waitForDialogOpened();
            //5. Fill in the input for required number of items:
            await confirmValueDialog.typeNumberOrName(1);
            //6. Click on the Confirm button:
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            //7. Verify that the status is UNPUBLISHED  in the wizard
            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.UNPUBLISHED, "The content gets Unpublished");
            await contentWizard.waitForPublishButtonDisplayed();
        });

    it(`GIVEN existing unpublished site is selected WHEN 'Publish...' button has been pressed AND Include children has been clicked THEN the site should be published`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open an existing site (work in progress)
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            //2. Click on 'Include children' icon
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //3. Click on 'Publish Now' button
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            //4. Verify that the status gets 'Published'
            await contentBrowsePanel.waitForStatus(SITE.displayName, appConst.CONTENT_STATUS.PUBLISHED);
            assert.equal(actualMessage, appConst.TWO_ITEMS_PUBLISHED, "'2 items are published.' should appear");
        });

    it("GIVEN existing published site is opened WHEN a text component has been inserted THEN site's state should be 'Modified' and 'Work in progress' icon should be displayed in the grid",
        async () => {
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open an existing site (work in progress)
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("main");
            //2. Insert Text Component with test text and save it:
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.typeTextInCkeEditor("test text");
            await contentWizard.waitAndClickOnSave();
            //3. Verify the workflow state in the wizard and in the grid
            let workflowInWizard = await contentWizard.getToolbarWorkflowState();
            assert.equal(workflowInWizard, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            await studioUtils.doSwitchToContentBrowsePanel();
            await contentBrowsePanel.waitForStatus(SITE.displayName, appConst.CONTENT_STATUS.MODIFIED);
            let actualState = await contentBrowsePanel.getWorkflowState(SITE.displayName);
            assert.equal(actualState, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS, "'Work in progress' should be displayed in browse panel");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
