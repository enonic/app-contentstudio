let webSocket = null;
let connections = 0; // Keeps track of active tab connections

const ports = new Set();

onconnect = event => {
    const port = event.ports[0];
    ports.add(port);
    connections++;
    console.log(port);
    console.log(`Total connections: ${connections}`);

    port.onmessage = messageEvent => {
        const {type, url} = messageEvent.data;

        switch (type) {
            case 'init':
                if (!webSocket) {
                    webSocket = createWebSocket(url);
                }
                port.postMessage({type: 'ready'});
                break;

            case 'send':
                const {data} = messageEvent.data;

                if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                    webSocket.send(data);
                    console.log(`Sent message: ${data}`);
                } else {
                    port.postMessage({type: 'error', message: 'WebSocket is not open.'});
                }
                break;

            case 'disconnect':
                connections--;
                console.log(`Total connections: ${connections}`);
                if (connections === 0 && webSocket) {
                    webSocket.close();
                    webSocket = null;
                }
                break;
        }
    };

    port.start(); // Start the communication channel

    port.onclose = () => {
        ports.delete(port);
    };
};

function createWebSocket(url) {
    const ws = new WebSocket(url, []);

    ws.onopen = () => {
        console.log('WebSocket connection opened.');
    };

    ws.onmessage = event => {
        broadcastToAllPorts({type: 'message', data: event.data});
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed.');
    };

    ws.onerror = error => {
        console.error('WebSocket error:', error);
        broadcastToAllPorts({type: 'error', message: 'WebSocket error occurred.'});
    };

    return ws;
}

function broadcastToAllPorts(message) {
    ports.forEach(port => {
        port.postMessage(message);
    });
}
