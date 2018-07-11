/**
 * Created on 17.05.2018.
 * verifies:https://github.com/enonic/app-contentstudio/issues/127  (shortcut for Publish button does not work)
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
const contentPublishDialog = require('../page_objects/content.publish.dialog');

describe('Wizard toolbar - shortcut spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let displayName;
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+s' has been pressed THEN folder should be saved`, () => {
        displayName = contentBuilder.generateRandomName('folder');
        return studioUtils.openContentWizard(appConstant.contentTypes.FOLDER).then(() => {
            return contentWizard.typeDisplayName(displayName);
        }).pause(1000).then(() => {
            return contentWizard.hotKeySave();
        }).then(result => {
            return contentWizard.waitForExpectedNotificationMessage(appConstant.itemSavedNotificationMessage(displayName));
        })
    });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, () => {
        return studioUtils.openContentInWizard(displayName).then(() => {
            return contentWizard.hotKeyDelete();
        }).then(() => {
            return deleteContentDialog.waitForDialogVisible();
        }).then(result => {
            studioUtils.saveScreenshot('wizard_shortcut_delete');
            assert.isTrue(result, 'Delete Dialog should be present');
        })
    });
//verifies:https://github.com/enonic/app-contentstudio/issues/127
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Alt+p' have been pressed THEN 'Publish Dialog' should appear`, () => {
        return studioUtils.openContentInWizard(displayName).then(() => {
        }).then(() => {
            return contentWizard.hotKeyPublish();
        }).then(() => {
            return contentPublishDialog.waitForDialogVisible();
        }).then(result => {
            studioUtils.saveScreenshot('wizard_shortcut_publish');
            assert.isTrue(result, 'Publish Dialog should be present');
        })
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
