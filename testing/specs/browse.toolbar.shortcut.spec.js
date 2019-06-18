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
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const NewContentDialog = require('../page_objects/browsepanel/new.content.dialog');

describe('Browse toolbar shortcut spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();


    it(`GIVEN content is selected WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let deleteContentDialog = new  DeleteContentDialog();
        return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
            return contentBrowsePanel.hotKeyDelete();
        }).then(() => {
            return deleteContentDialog.waitForDialogOpened();
        }).then(result => {
            assert.isTrue(result, 'Delete Dialog should be present');
        })
    });

    it(`GIVEN content is selected WHEN 'Ctrl+e' have been pressed THEN 'Content Wizard' should be loaded`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentWizard = new  ContentWizard();
        return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
            return contentBrowsePanel.hotKeyEdit();
        }).then(() => {
            return studioUtils.switchToContentTabWindow('All Content types images');
        }).then(() => {
            return contentWizard.waitForOpened();
        }).then(result => {
            assert.isTrue(result, 'Content Wizard should be loaded');
        })
    });
    it(`WHEN 'Alt+n' have been pressed THEN 'New content' dialog should be loaded`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog()
        return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
            return contentBrowsePanel.hotKeyNew();
        }).then(() => {
            return newContentDialog.waitForOpened();
        }).then(result => {
            assert.isTrue(result, 'New Content Dialog should be loaded');
        });
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
