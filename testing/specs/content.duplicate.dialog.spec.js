/**
 * Created on 29.05.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentDuplicateDialog = require('../page_objects/content.duplicate.dialog');

describe('content.duplicate.dialog.spec: Content Duplicate Dialog specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN folder(12 children) is selected WHEN 'Duplicate...' button has been clicked THEN 'Content Duplicate Dialog' should be loaded and expected elements should be present`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            //1. Select the folder(12 children)
            await studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME);
            //2. Open Duplicate dialog:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            let result = await contentDuplicateDialog.isIncludeChildTogglerDisplayed();
            assert.isTrue(result, 'Include Child toggler should be displayed');
            result = await contentDuplicateDialog.isShowDependentItemsLinkDisplayed();
            assert.isTrue(result, "'Show Dependent Items' link should be displayed");
            result = await contentDuplicateDialog.isDuplicateButtonDisplayed();
            assert.isTrue(result, 'Duplicate button should be displayed');
            result = await contentDuplicateDialog.isCancelButtonDisplayed();
            assert.isTrue(result, 'Cancel button should be displayed');
            // get number in 'Hide dependent items' link
            let numberInHideDependent = await contentDuplicateDialog.getNumberInDependentItemsLink();
            assert.equal(numberInHideDependent, '12', "Expected number should be in 'Hide dependent items' link");
            //Get Number in 'Duplicate' button
            let totalNumber = await contentDuplicateDialog.getTotalNumberItemsToDuplicate();
            assert.equal(totalNumber, '13', "Expected number in the Duplicate button should be displayed");
            let names = await contentDuplicateDialog.getDisplayNamesToDuplicate();
            assert.equal(names[0], appConstant.TEST_FOLDER_WITH_IMAGES, `expected parent's display name should be present`);
        });

    it(`GIVEN 2 folder with children are selected WHEN 'Duplicate...' button has been clicked THEN expected display names should be present on the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            //1. Two folders have been selected:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_2_NAME);
            //2. Open Duplicate dialog:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            studioUtils.saveScreenshot("duplicate_dialog_2_items");
            let names = await contentDuplicateDialog.getDisplayNamesToDuplicate();
            assert.equal(names.length, 2, '2 items to duplicate should be displayed');
            assert.equal(names[0], appConstant.TEST_FOLDER_WITH_IMAGES, 'expected parent\'s display name should be present');
            assert.equal(names[1], appConstant.TEST_FOLDER_2_DISPLAY_NAME, 'expected parent\'s display name should be present');
        });

    it(`GIVEN 'Content Duplicate' dialog is opened WHEN 'exclude child' has been clicked THEN 'Show Dependent Items' should not be displayed `,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            //1. Select the folder(12 children) :
            await studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            // 2. Click on the 'Include child toggler' and exclude children items
            await contentDuplicateDialog.clickOnIncludeChildToggler();
            let isDisplayed = await contentDuplicateDialog.isIncludeChildTogglerDisplayed();
            assert.isTrue(isDisplayed, 'Include Child toggler should be displayed');
            studioUtils.saveScreenshot("duplicate_dialog_child_excluded");
            // `Show Dependent Items` link gets hidden:
            isDisplayed = await contentDuplicateDialog.isShowDependentItemsLinkDisplayed();
            assert.isFalse(isDisplayed, "'Show Dependent Items' link should not be displayed");
        });

    it(`GIVEN 'Content Duplicate' dialog is opened WHEN 'Show dependent items' link has been clicked THEN 'Hide dependent Items' should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            await studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            //Click on 'Show dependent items'
            await contentDuplicateDialog.clickOnShowDependentItemLink();
            // 'Hide dependent items' should appear, otherwise exception will be thrown
            await contentDuplicateDialog.waitForHideDependentItemLinkDisplayed();

            studioUtils.saveScreenshot("duplicate_show_dependent_clicked");
            let names = await contentDuplicateDialog.getDependentsName();
            assert.equal(names.length, 12, '12 dependents to duplicate should be displayed');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
