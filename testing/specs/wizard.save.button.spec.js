/**
 * Created on 23.01.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');

describe('wizard.save.button.spec:  Save and Saved buttons spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN folder-wizard is opened THEN 'Save' button should be disabled`,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.FOLDER).then(()=> {
            }).then(()=> {
                return contentWizard.waitForSaveButtonEnabled();
            }).then(isEnabled=> {
                assert.isFalse(isEnabled, '`Save` button should be disabled');
            });
        });

    it(`WHEN folder-wizard is opened WHEN name has been typed THEN Save button is getting enabled `,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.FOLDER).then(()=> {
            }).then(()=> {
                return contentWizard.typeDisplayName('test999');
            }).then(()=> {
                return contentWizard.waitForSaveButtonEnabled();
            }).then(isEnabled=> {
                assert.isTrue(isEnabled, '`Save` button is getting enabled');
            });
        });
//verifies xp-apps#503  Incorrect label for button Save on the toolbar, when any data has been changed
    it(`WHEN folder-wizard is opened AND name was typed WHEN the name has been cleared THEN Save button should be enabled`,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.FOLDER).then(()=> {
            }).then(()=> {
                return contentWizard.typeDisplayName('test999');
            }).pause(3000).then(()=> {
                return contentWizard.clearDisplayNameInput();
            }).then(()=> {
                studioUtils.saveScreenshot('save_button_clear_name');
                return contentWizard.waitForSaveButtonVisible();
            }).then(()=> {
                return contentWizard.waitForSaveButtonDisabled();
            }).then(isDisabled=> {
                assert.isTrue(isDisabled, 'Save button is getting disabled');
            });
        });

    it(`WHEN folder-wizard is opened AND name was typed WHEN 'Save' button has been pressed THEN 'Saved' button should be visible`,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.FOLDER).then(()=> {
            }).then(()=> {
                return contentWizard.typeDisplayName('test999');
            }).pause(1000).then(()=> {
                return contentWizard.waitAndClickOnSave();
            }).then(()=> {
                return contentWizard.waitForSavedButtonVisible();
            }).then(isVisible=> {
                assert.isTrue(isVisible, '`Saved` button is getting visible');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
