/**
 * Created on 28.05.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');


describe('Browse panel selections spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN one row with content has been clicked THEN the row is getting selected AND 'Selection Toggler' should not be visible`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        return contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES).then(() => {
            return contentBrowsePanel.getNameOfSelectedRow();
        }).then(result=>{
            assert.equal (result, appConstant.TEST_FOLDER_WITH_IMAGES, "expected content should be highlighted");
        }).then(()=>{
            return contentBrowsePanel.getNumberOfSelectedRows();
        }).then(result => {
            studioUtils.saveScreenshot('row_clicked');
            assert.isTrue(result === 1, 'One row should be highlighted');
        }).then(() => {
            return contentBrowsePanel.getNumberOfCheckedRows()
        }).then(result => {
            assert.isTrue(result === 0, 'no one row should be checked');
        }).then(() => {
            return assert.eventually.isFalse(contentBrowsePanel.waitForSelectionTogglerVisible(), '`Selection Toggler` should not be visible on the toolbar');
        })
    });

    it(`WHEN one row with content has been checked THEN the row is getting checked AND 'Selection Toggler' is getting visible`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        return contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES).then(() => {
            return contentBrowsePanel.getNumberOfSelectedRows();
        }).then(result => {
            studioUtils.saveScreenshot('one_row_checked');
            assert.isTrue(result === 0, 'no one row should be selected');
        }).then(() => {
            return contentBrowsePanel.getNumberOfCheckedRows();
        }).then(result => {
            assert.isTrue(result === 1, 'One row should be checked');
        }).then(() => {
            return assert.eventually.isTrue(contentBrowsePanel.waitForSelectionTogglerVisible(), 'Selection Toggler should appear on the toolbar');
        })
    });

    it(`GIVEN one row is checked WHEN one more row with content has been checked THEN 2 rows should be checked AND 0 rows is selected`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        return contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES).then(() => {
            return contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.TEST_FOLDER_2_DISPLAY_NAME)
        }).then(() => {
            return contentBrowsePanel.getNumberOfSelectedRows();
        }).then(result => {
            studioUtils.saveScreenshot('two_rows_checked');
            assert.isTrue(result === 0, 'no one row should be selected');
        }).then(() => {
            return contentBrowsePanel.getNumberOfCheckedRows()
        }).then(result => {
            assert.isTrue(result === 2, 'Two rows should be checked');
        })
    });

    it(`GIVEN one row is selected WHEN the row has been clicked THEN the row is getting unselected`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        return contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES).then(() => {
            return contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES)
        }).then(()=>{
            return contentBrowsePanel.pause(1000);
        }).then(() => {
            return contentBrowsePanel.getNumberOfSelectedRows();
        }).then(result => {
            studioUtils.saveScreenshot('two_rows_checked');
            assert.isTrue(result === 0, 'no one row should be selected');
        }).then(() => {
            return contentBrowsePanel.getNumberOfCheckedRows()
        }).then(result => {
            assert.isTrue(result == 0, '0 rows should be checked');
        })
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
