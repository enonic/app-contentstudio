var portal = require('/lib/xp/portal');
var contentSvc = require('/lib/xp/content');
var stk = require('stk/stk');

exports.post = handlePost;

function handlePost(req) {
    var contentData = req.params;
    var contentCreated = null;
    var contentItem = stk.content.get(contentData.content_ID);
    var contentFolder;
    var saveLocation;

    if (stk.content.exists(contentItem._path + '/content')) {
        saveLocation = contentItem._path + '/content';
    } else {
        contentFolder = contentSvc.create({
            name: 'content',
            parentPath: contentItem._path,
            displayName: 'Content',
            draft: true,
            requireValid: true,
            contentType: 'base:folder',
            data: {}
        });

        saveLocation = contentFolder._path;
    }

    var contentName = 'Content-' + Math.floor((Math.random() * 1000000000) + 1);

    var newContent = contentSvc.create({
        name: contentName,
        parentPath: saveLocation,
        displayName: contentName,
        draft: true,
        requireValid: true,
        contentType: app.name + ':all-input-types',
        data: {
            myDateTime: contentData.datetime,
            myCheckbox: contentData.checkbox,
            myGeoPoint: contentData.geopoint,
            myDate: contentData.date,
            myComboBox: contentData.combobox,
            myDouble: contentData.double,
            myHtmlArea: contentData.htmlarea,
            myLong: contentData.long,
            myTextLine: contentData.textline,
            myTextArea: contentData.textarea,
            myTime: contentData.time,
            myXml: contentData.xml,
            myTag: contentData.tag,
            myRadioButton: contentData.radio
        }
    });

    if (newContent._id) {
        contentCreated = true;
        stk.log('New content created with id ' + newContent._id);
    } else {
        stk.log('Something went wrong creating content for ' + contentItem.displayName);
    }

    return {

        redirect: portal.pageUrl({
            path: contentItem._path,
            params: {
                submitted: contentCreated ? 'ok' : null,
                contentId: contentCreated ? newContent._id : null
            }
        })
    }
}