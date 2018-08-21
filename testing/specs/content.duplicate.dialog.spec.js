/**
 * Created on 29.05.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const issueListDialog = require('../page_objects/issue/issue.list.dialog');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentDuplicateDialog = require('../page_objects/content.duplicate.dialog');


describe('content.duplicate.dialog.spec: Content Duplicate Dialog specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN one folder with children is selected WHEN 'Duplicate...' button has been clicked THEN 'Content Duplicate Dialog' should be loaded and all elements should be present`,
        () => {
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return assert.eventually.isTrue(contentDuplicateDialog.isIncludeChildTogglerDisplayed(),
                    'Include Child toggler should be displayed');
            }).then(() => {
                return assert.eventually.isTrue(contentDuplicateDialog.isShowDependentItemsLinkDisplayed(),
                    '`Show Dependent Items` link should be displayed');
            }).then(() => {
                return assert.eventually.isTrue(contentDuplicateDialog.isDuplicateButtonDisplayed(), 'Duplicate should be displayed');
            }).then(() => {
                return assert.eventually.isTrue(contentDuplicateDialog.isCancelButtonDisplayed(), 'Cancel button should be displayed');
            }).then(() => {
                // get number in 'Hide dependent items' link
                return expect(contentDuplicateDialog.getNumberInDependentItemsLink()).to.eventually.equal('12');
            }).then(() => {
                //Get Nunmber in 'Duplicate' button
                return expect(contentDuplicateDialog.getTotalNumberItemsToDuplicate()).to.eventually.equal('13');
            }).then(() => {
                return contentDuplicateDialog.getDisplayNamesToDuplicate();
            }).then(result => {
                assert.isTrue(result == appConstant.TEST_FOLDER_WITH_IMAGES, `correct parent's display name should be present`);
            })
        });

    it(`GIVEN 2 folder with children are selected WHEN 'Duplicate...' button has been clicked THEN correct display names should be present on the dialog`,
        () => {
            return contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_NAME).then(() => {
                return contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_2_NAME)
            }).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return contentDuplicateDialog.getDisplayNamesToDuplicate();
            }).then(result => {
                assert.isTrue(result.length == 2, '2 items to duplicate should be disaplayed');
                assert.isTrue(result[0] == appConstant.TEST_FOLDER_WITH_IMAGES, 'correct parent\'s display name should be present');
                assert.isTrue(result[1] == appConstant.TEST_FOLDER_2_DISPLAY_NAME, 'correct parent\'s display name should be present');
            })
        });

    it(`GIVEN 'Content Duplicate' dialog is opened WHEN 'exclude child' has been clicked THEN 'Show Dependent Items' should not be displayed `,
        () => {
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return contentDuplicateDialog.clickOnIncludeChildToggler();
            }).pause(300).then(() => {
                return assert.eventually.isTrue(contentDuplicateDialog.isIncludeChildTogglerDisplayed(),
                    'Include Child toggler should be displayed');
            }).then(() => {
                studioUtils.saveScreenshot("duplicate_child_excluded");
                return assert.eventually.isFalse(contentDuplicateDialog.isShowDependentItemsLinkDisplayed(),
                    '`Show Dependent Items` link should not be displayed');
            });
        });

    it(`GIVEN 'Content Duplicate' dialog is opened WHEN 'Show dependent items' link has been clicked THEN 'Hide dependent Items' should appear`,
        () => {
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return contentDuplicateDialog.clickOnShowDependentItemLink();
            }).then(() => {
                return assert.eventually.isTrue(contentDuplicateDialog.waitForHideDependentItemLinkDisplayed(),
                    `'Hide dependent items' should appear`);
            }).then(() => {
                studioUtils.saveScreenshot("duplicate_show_dependent_clicked");
                return contentDuplicateDialog.getDependentsName();
            }).then(result => {
                assert.isTrue(result.length == 12, '12 dependents to duplicate should be displayed');
            });
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
