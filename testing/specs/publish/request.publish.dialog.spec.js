/**
 * Created on 07.08.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const RequestContentPublishDialog = require('../../page_objects/issue/request.content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const DateTimeRange = require('../../page_objects/components/datetime.range');

describe('request.publish.dialog.spec - opens request publish modal dialog and checks control elements`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER1_NAME;

    let SITE;
    it(`GIVEN folder is opened AND 'Marked as ready' is done WHEN request publish dialog has been opened THEN 'Next' button AND one item should be present on the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let requestPublishDialog = new RequestContentPublishDialog();
            FOLDER1_NAME = contentBuilder.generateRandomName('folder');
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER1_NAME);
            //the folder should be marked as ready.
            await contentWizard.clickOnMarkAsReadyButton();

            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            studioUtils.saveScreenshot("wizard_publish_dialog_single_folder");
            let status = await requestPublishDialog.getContentStatus(FOLDER1_NAME);

            assert.equal(status, "New", "'New' status should be displayed in the dialog");
            let isPresent = await requestPublishDialog.waitForNextButtonDisplayed();
            assert.isTrue(isPresent, "'Next' button should be displayed");

            let isRemovable = await requestPublishDialog.isItemRemovable(FOLDER1_NAME);
            assert.isFalse(isRemovable, "One item should be displayed on the dialog and it should not be removable");
        });

    it(`GIVEN existing folder with children is selected AND 'Request Publishing...' menu item has been clicked WHEN 'Include child' icon has been clicked THEN 'Show dependent items' link should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let requestPublishDialog = new RequestContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();

            //folder with children is selected
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();

            //click on 'Include children items'
            await requestPublishDialog.clickOnIncludeChildItems(appConst.TEST_FOLDER_WITH_IMAGES);
            studioUtils.saveScreenshot("request_publish_include_children");
            //new wizard-tab should be opened
            await requestPublishDialog.waitForShowDependentItemsLinkDisplayed();
        });


    it(`GIVEN existing folder is selected AND 'Request Publishing...' menu item has been clicked  WHEN an item to publish has been clicked THEN this item should be opened in new wizard-tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let requestPublishDialog = new RequestContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();

            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();

            //click on the publish-item
            await requestPublishDialog.clickOnItemToPublishAndSwitchToWizard(FOLDER1_NAME);
            //new wizard-tab should be opened
            await contentWizard.waitForOpened();
            studioUtils.saveScreenshot("publish_request_dialog_item_clicked");
            let displayName = await contentWizard.getDisplayName();
            assert.equal(displayName, FOLDER1_NAME, "Expected display name should be present in that wizard");
        });

    it(`GIVEN folder is selected AND 'Request Publishing' dialog is opened WHEN 'Next' button has been pressed THEN new wizard page should be loaded`,
        async () => {
            let requestPublishDialog = new RequestContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();

            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            await requestPublishDialog.clickOnNextButton();

            studioUtils.saveScreenshot("request_publishing_next");
            //'Create Request' button should be disabled , because required input is empty:
            await requestPublishDialog.waitForCreateRequestButtonDisabled();
            //Previous button.
            await requestPublishDialog.waitForPreviousButtonDisplayed();
        });



    it(`GIVEN the second page in 'Request Publishing' wizard is opened WHEN 'Previous' button has been pressed THEN first wizard page should be loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let requestPublishDialog = new RequestContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();

            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //expand the 'Publish Menu' and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            await requestPublishDialog.clickOnNextButton();

            //click on 'Previous' button
            await requestPublishDialog.clickOnPreviousButton();
            //'Next' button should appear
            await requestPublishDialog.waitForNextButtonDisplayed();
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});