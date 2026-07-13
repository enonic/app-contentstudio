import { nanoid } from 'nanoid';

/**
 * Generate a URL-safe, collision-resistant random id.
 *
 * Backed by nanoid, which draws from `crypto.getRandomValues`. Unlike
 * `crypto.randomUUID`, that source is available in insecure (non-HTTPS)
 * contexts, so this works regardless of the origin's security context.
 */
export function randomId(): string {
    return nanoid();
}
