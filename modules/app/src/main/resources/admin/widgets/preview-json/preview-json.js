/*global app, resolve*/

const widgetLib = require('/lib/export/widget');

exports.get = function (req) {

    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: e.message
        };
    }

    if (!exports.canRender(req)) {
        // needed for the head request,
        // return 418 if not able to render
        log.info('Json [GET] can\'t render: ' + 418);

        return {
            status: 418,
            contentType: 'text/plain',
            body: 'Cannot render json'
        }
    }

    try {
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);

        log.info('Json [GET] exists: ' + !!content);

        if (content) {
            return {
                contentType: 'text/html',
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Security-Policy': "media-src 'self'"
                },
                status: 200,
                body: buildBody(content)
            };
        } else {
            return {
                status: 404,
                contentType: 'text/plain',
                body: 'Content not found'
            };
        }
    } catch (e) {
        return {
            status: 500,
            contentType: 'text/plain',
            body: 'Failed to render json: ' + e.message
        }
    }
}


exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);
        const canRender = !!content;

        log.info('Json [CAN_RENDER]: ' + canRender);

        return canRender;
    } catch (e) {
        return false;
    }
}

function buildBody(content) {
    return `<html lang="en"><head>
                <title>${content.displayName}</title>
                <style>
                    body {
                        background-color: #333842;
                        margin: 0;
                    }
                    pre.json {
                      flex: 1;
                      padding: 20px;
                      margin: 0;
                      font-size: 16px;
                      overflow: auto;
                      color: #b3bac6;

                      .string {
                        color: #98c379;
                      }

                      .number {
                        color: #61aeee;
                      }

                      .boolean {
                        color: #c678dd;
                      }

                      .null {
                        color: #c678dd;
                      }

                      .key {
                        color: inherit;
                      }
                    }
                </style>
            </head>
            <body>
                <pre class="json">${highlightJson(content)}</pre>
            </body>
        </html>`
}

function highlightJson(json) {
    let str = JSON.stringify(json, undefined, 4);
    str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}