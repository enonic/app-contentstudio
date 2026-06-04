import {describe, expect, it} from 'vitest';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {isOnline} from './status';

const HOUR_MS = 60 * 60 * 1_000;

function summary({from, to, publishTime}: {
    from?: Date | null;
    to?: Date | null;
    publishTime?: Date | null;
}): ContentSummary {
    return {
        getPublishFromTime: () => from ?? null,
        getPublishToTime: () => to ?? null,
        getPublishTime: () => publishTime ?? null,
        getPublishFirstTime: () => null,
    } as unknown as ContentSummary;
}

describe('status', () => {
    describe('isOnline', () => {
        const past = new Date(Date.now() - HOUR_MS);
        const future = new Date(Date.now() + HOUR_MS);

        it('returns false for offline content with no publish-from time', () => {
            expect(isOnline(summary({from: null}))).toBe(false);
        });

        it('returns true for online content in sync', () => {
            expect(isOnline(summary({from: past, publishTime: past}))).toBe(true);
        });

        it('returns false for online content with pending changes', () => {
            expect(isOnline(summary({from: past, publishTime: null}))).toBe(false);
        });

        it('returns true for scheduled content in sync', () => {
            expect(isOnline(summary({from: future, publishTime: past}))).toBe(true);
        });

        it('returns true for expired content in sync', () => {
            expect(isOnline(summary({from: past, to: past, publishTime: past}))).toBe(true);
        });
    });
});
