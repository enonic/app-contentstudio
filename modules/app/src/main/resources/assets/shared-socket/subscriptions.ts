interface Subscription {
    id: string;
    port: MessagePort;
    operations: Set<string>;
}

const subscriptionsByPort = new Map<MessagePort, Subscription>();
const subscriptionsById = new Map<string, Subscription>();

export function subscribe(port: MessagePort, operation: string): string {
    const subscription = subscriptionsByPort.get(port);
    if (subscription == null) {
        const operations = new Set([operation]);
        const id = crypto.randomUUID();
        const subscription: Subscription = {id, port, operations};
        subscriptionsByPort.set(port, subscription);
        subscriptionsById.set(id, subscription);
        return id;
    }

    subscription.operations.add(operation);
    return subscription.id;
}

export function unsubscribe(port: MessagePort, operation: string): void {
    const subscription = subscriptionsByPort.get(port);
    if (subscription == null) {
        return;
    }

    subscription.operations.delete(operation);

    if (subscription.operations.size === 0) {
        subscriptionsByPort.delete(port);
        subscriptionsById.delete(subscription.id);
    }
}

export function unsubscribeAll(port: MessagePort): void {
    const subscription = subscriptionsByPort.get(port);
    if (subscription) {
        subscriptionsByPort.delete(port);
        subscriptionsById.delete(subscription.id);
    }
}

export function broadcast(data: unknown, operation?: string) {
    for (const subscription of subscriptionsByPort.values()) {
        if (operation == null || subscription.operations.has(operation)) {
            subscription.port.postMessage(data);
        }
    }
}

export function sendTo(id: string, operation: string, data: unknown) {
    const subscription = subscriptionsById.get(id);
    if (subscription == null) {
        return;
    }
    subscription.port.postMessage(data);
}
