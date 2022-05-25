/**
 * Created on 25.04.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');

describe('test for wizard page when collaboration property is enabled', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    //Verify issue https://github.com/enonic/app-contentstudio/issues/4457
    //Content wizard: new content wizard is not loaded when collaboration is enabled #4457
    it(`GIVEN collaboration is enabled in cfg WHEN folder wizard has been opened THEN expected collaboration icon should be displayed`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            //1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await studioUtils.saveScreenshot("collaboration_wizard");
            //2. Verify that collaboration icon is displayed:
            let compactNames = await contentWizard.getCollaborationUserCompactName();
            assert.equal(compactNames[0], "SU", "SU user should be displayed in the toolbar");
            assert.equal(compactNames.length, 1, "One compact name should be displayed");
            //3. Verify that Workflow icon is not displayed in the toolbar
            await contentWizard.waitForStateIconNotDisplayed();
        });

    it(`GIVEN 'Filter Panel' is opened WHEN less than 5 content types are present THEN 'Show more' button should not be displayed`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Open Filter Panel:
            await studioUtils.openFilterPanel();
            //2. Verify that 'Show more' button is not displayed in the filter panel
            await filterPanel.waitForShowMoreButtonNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
