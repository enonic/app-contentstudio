/**
 * Created on 24.05.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const OptionSetUnlimitedOptions = require('../../page_objects/wizardpanel/optionset/optionset.unlimited.options');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe("optionset.validation.spec: tests for validation of option set", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const DISPLAY_NAME = contentBuilder.generateRandomName('optionset');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies: https://github.com/enonic/xp/issues/8765
    //Option-set with unlimited number of allowed selections is considered invalid #8765
    it(`GIVEN option set with default selected option is opened WHEN the default option has been unselected AND saved THEN the content should be valid in wizard`,
        async () => {
            let optionSetUnlimitedOptions = new OptionSetUnlimitedOptions();
            let contentWizard = new ContentWizard();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset1');
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            //2. Click  and unselect the default option :
            await optionSetUnlimitedOptions.clickOnOption("Option 2");
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('item_set_unlimited1');
            await contentWizard.waitUntilInvalidIconDisappears();
        });
    //Verifies: https://github.com/enonic/xp/issues/8765
    //Option-set with unlimited number of allowed selections is considered invalid #8765
    it("WHEN existing option set has been filtered THEN the content should be valid in grid",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. select existing option set:
            await studioUtils.findAndSelectItem(DISPLAY_NAME);
            studioUtils.saveScreenshot('item_set_unlimited1');
            let isNotValid = await contentBrowsePanel.isRedIconDisplayed(DISPLAY_NAME);
            assert.isFalse(isNotValid, "Option Set content should be valid in Grid");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
