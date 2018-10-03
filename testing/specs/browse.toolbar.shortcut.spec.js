/**
 * Created on 17.05.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const deleteContentDialog = require('../page_objects/delete.content.dialog');
const newContentDialog = require('../page_objects/browsepanel/new.content.dialog');

describe('Browse toolbar shortcut spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();


    it(`GIVEN content is selected WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, () => {
        return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
        }).then(() => {
            return contentBrowsePanel.hotKeyDelete();
        }).then(() => {
            return deleteContentDialog.waitForDialogVisible();
        }).then(result => {
            assert.isTrue(result, 'Delete Dialog should be present');
        })
    });

    it(`GIVEN content is selected WHEN 'Ctrl+e' have been pressed THEN 'Content Wizard' should be loaded`, () => {
        return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
        }).then(() => {
            return contentBrowsePanel.hotKeyEdit();
        }).pause(1000).then(() => {
            return studioUtils.switchToContentTabWindow('All Content types images');
        }).then(() => {
            return contentWizard.waitForOpened();
        }).then(result => {
            assert.isTrue(result, 'Content Wizard should be loaded');
        })
    });
    it(`WHEN 'Ctrl+n' have been pressed THEN 'New content' dialog should be loaded`, () => {
        return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
            return contentBrowsePanel.hotKeyNew();
        }).then(() => {
            return newContentDialog.waitForOpened();
        }).then(result => {
            assert.isTrue(result, 'New Content Dialog should be loaded');
        }).then(()=>{
            return assert.eventually.isTrue(newContentDialog.hasDefaultFocus(`//input[contains(@placeholder,'Search for content types')]`));
        })
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
