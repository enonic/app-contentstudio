/**
 * Created on 07.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('request.publish.dialog.spec - opens request publish modal dialog and checks control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER1_NAME;

    it(`GIVEN folder is opened AND 'Marked as ready' is done WHEN request publish dialog has been opened THEN 'Next' button AND one item should be present in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            FOLDER1_NAME = contentBuilder.generateRandomName('folder');
            //1. Open new folder-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER1_NAME);
            //2.Click on  'mark as ready':
            await contentWizard.clickOnMarkAsReadyButton();
            //3. Expand the Publish Menu and select 'Request Publishing...' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            studioUtils.saveScreenshot("wizard_publish_dialog_single_folder");
            let status = await createRequestPublishDialog.getContentStatus(FOLDER1_NAME);

            assert.equal(status, "New", "'New' status should be displayed in the dialog");
            let isPresent = await createRequestPublishDialog.waitForNextButtonDisplayed();
            assert.isTrue(isPresent, "'Next' button should be displayed");

            let isRemovable = await createRequestPublishDialog.isItemRemovable(FOLDER1_NAME);
            assert.isFalse(isRemovable, "One item should be displayed on the dialog and it should not be removable");
        });

    it(`GIVEN existing folder with children is selected AND 'Request Publishing...' menu item has been clicked WHEN 'Include child' icon has been clicked THEN 'Show dependent items' link should appear`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. folder with children is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            //2. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_FOLDER_WITH_IMAGES_2);
            studioUtils.saveScreenshot("request_publish_include_children");
            //3. 'Show dependent items' link should appear, because all children are Ready for publishing
            await createRequestPublishDialog.waitForShowDependentItemsLinkDisplayed();
        });

    it(`GIVEN existing folder is selected AND 'Request Publishing...' menu item has been clicked  WHEN an item to publish has been clicked THEN this item should be opened in new wizard-tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1.Select the existing content:
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //expand the Publish Menu and click on 'Request Publishing...' menu item:
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            //click on the publish-item:
            await createRequestPublishDialog.clickOnItemToPublishAndSwitchToWizard(FOLDER1_NAME);
            //new wizard-tab should be opened
            await contentWizard.waitForOpened();
            await studioUtils.saveScreenshot("publish_request_dialog_item_clicked");
            let displayName = await contentWizard.getDisplayName();
            assert.equal(displayName, FOLDER1_NAME, "Expected display name should be present in that wizard");
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/867  Create request button should be disabled when required input is empty
    it(`GIVEN folder is selected AND 'Request Publishing' dialog is opened WHEN 'Next' button has been pressed THEN new wizard page should be loaded`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1.Select the content:
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //2. expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            await createRequestPublishDialog.clickOnNextButton();
            await studioUtils.saveScreenshot("request_publishing_next");
            //'Create Request' button should be disabled , because required input is empty:
            await createRequestPublishDialog.waitForCreateRequestButtonDisabled();
            //Previous button.
            await createRequestPublishDialog.waitForPreviousButtonDisplayed();
        });

    it(`GIVEN the second page in 'Request Publishing' wizard is opened WHEN 'Previous' button has been pressed THEN first wizard page should be loaded`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1.Select the content:
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //2. expand the 'Publish Menu' and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            //3. Go to the second step in the wizard:
            await createRequestPublishDialog.clickOnNextButton();
            //4. click on 'Previous' button
            await createRequestPublishDialog.clickOnPreviousButton();
            //'Next' button should appear:
            await createRequestPublishDialog.waitForNextButtonDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
