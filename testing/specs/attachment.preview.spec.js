/**
 * Created on 22.03.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');


describe('attachment.preview.spec - Select a *.txt file and check expected text in Preview Panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    it(`WHEN existing *.txt file is selected WHEN expected text should be loaded in Preview Panel`,
        () => {
        let contentItemPreviewPanel = new  ContentItemPreviewPanel();
            return studioUtils.findAndSelectItem("test-text.txt").then(() => {
                return contentItemPreviewPanel.getTextInAttachmentPreview();
            }).then(result => {
                assert.isTrue(result.includes('Belarus'), "expected text should be present in the Preview Panel");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
