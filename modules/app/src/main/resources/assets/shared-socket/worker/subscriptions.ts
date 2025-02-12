const subscriptions = new Map<string, Set<string>>();

export function subscribe(id: string, operation: string): void {
    const subscription = subscriptions.get(id);
    if (subscription == null) {
        const operations = new Set([operation]);
        subscriptions.set(id, operations);
    } else {
        subscription.add(operation);
    }
}

export function unsubscribe(id: string, operation: string): void {
    const subscription = subscriptions.get(id);
    if (subscription == null) {
        return;
    }

    subscription.delete(operation);

    if (subscription.size === 0) {
        subscriptions.delete(id);
    }
}

export function unsubscribeAll(id: string): void {
    subscriptions.delete(id);
}

export function getSubscribers(operation: string): Set<string> {
    const subscribers = new Set<string>();

    for (const [id, subscription] of subscriptions.entries()) {
        for (const pattern of subscription) {
            if (isPatternMatch(pattern, operation)) {
                subscribers.add(id);
                break;
            }
        }
    }

    return subscribers;
}

export function isSubscribed(id: string, operation: string): boolean {
    const subscription = subscriptions.get(id);
    if (!subscription) return false;

    for (const pattern of subscription) {
        if (isPatternMatch(pattern, operation)) {
            return true;
        }
    }
    return false;
}

function isPatternMatch(pattern: string, operation: string): boolean {
    // ! This pattern follows the XP events pattern
    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(operation);
}
