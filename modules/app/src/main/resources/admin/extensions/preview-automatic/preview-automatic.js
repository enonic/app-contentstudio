/*global app, resolve*/

function handleGet(req) {
    return {
        status: 410,
        body: 'Automatic widget preview should be handled on the client.'
    };
}

exports.get = handleGet;
