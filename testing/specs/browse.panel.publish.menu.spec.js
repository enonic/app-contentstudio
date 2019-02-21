/**
 * Created on 18.02.2019.
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


describe('browse.panel.publish.menu.spec tests for Publish button in grid-toolbar`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let FOLDER;

    it(`Preconditions: test folder should be created`,
        () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            return studioUtils.doAddFolder(FOLDER).then(() => {
                return studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(FOLDER.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'folder should be listed in the grid');
            });
        });

    it(`Preconditions: test site should be created`, () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
        return studioUtils.doAddSite(SITE).then(() => {
        }).then(() => {
            return studioUtils.findAndSelectItem(SITE.displayName);
        }).then(() => {
            return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
        }).then(isDisplayed => {
            assert.isTrue(isDisplayed, 'site should be listed in the grid');
        });
    });

    it(`GIVEN browse panel is loaded WHEN no selected items THEN 'CREATE ISSUE...' button should appear on browse-toolbar`, () => {
        return contentBrowsePanel.waitForCreateIssueButtonVisible();
    });

    it(`WHEN existing new folder has been selected THEN 'Publish' button should appear on browse-toolbar`, () => {
        return studioUtils.findAndSelectItem(FOLDER.displayName).then(() => {
            return contentBrowsePanel.waitForPublishButtonVisible();
        }).then(() => {
            // do publish the folder
            return studioUtils.doPublish();
        }).then(() => {
            return expect(contentBrowsePanel.getContentStatus(FOLDER.displayName)).to.eventually.equal('Published');
        })
    });
    it(`WHEN existing published folder has been selected THEN 'UNPUBLISH...' button should appear on browse-toolbar`,
        () => {
            return studioUtils.findAndSelectItem(FOLDER.displayName).then(() => {
                return contentBrowsePanel.waitForUnPublishButtonVisible();
            });
        });

    it(`GIVEN site has been published (children are not included)  WHEN the site has been selected THEN 'PUBLISH TREE...' button should appear on browse-toolbar`,
        () => {
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                //site has been published and children are not included
                return studioUtils.doPublish(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForPublishTreeButtonVisible();
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
