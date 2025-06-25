import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {createLatestFetcher} from './latestFetcher';

describe('createLatestFetcher', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('single request', () => {
        it('should return response for a single request', async () => {
            const mockResponse = new Response('{"data": "test"}', {
                status: 200,
                headers: {'Content-Type': 'application/json'},
            });

            vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

            const latestFetch = createLatestFetcher();
            const response = await latestFetch('/api/data');

            expect(response).toBe(mockResponse);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith('/api/data', {
                signal: expect.any(AbortSignal),
            });
        });

        it('should forward request init options', async () => {
            const mockResponse = new Response('{}', {status: 200});
            vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

            const latestFetch = createLatestFetcher();
            const init: RequestInit = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({test: 'data'}),
            };

            await latestFetch('/api/data', init);

            expect(fetch).toHaveBeenCalledWith('/api/data', {
                ...init,
                signal: expect.any(AbortSignal),
            });
        });

        it('should throw network errors for single request', async () => {
            const networkError = new Error('Network error');
            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            const latestFetch = createLatestFetcher();

            await expect(latestFetch('/api/data')).rejects.toThrow('Network error');
        });
    });

    describe('multiple consecutive requests', () => {
        it('should return null for aborted requests and response for latest', async () => {
            const latestFetch = createLatestFetcher();

            // Create promises that we can control
            let resolveFirst: (value: Response) => void;
            let resolveSecond: (value: Response) => void;

            const firstPromise = new Promise<Response>((resolve) => {
                resolveFirst = resolve;
            });
            const secondPromise = new Promise<Response>((resolve) => {
                resolveSecond = resolve;
            });

            vi.mocked(fetch).mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

            // Start both requests
            const request1 = latestFetch('/api/data?q=a');
            const request2 = latestFetch('/api/data?q=ab');

            // Resolve in order
            resolveFirst(new Response('{"results": ["a"]}'));
            resolveSecond(new Response('{"results": ["ab"]}'));

            const [result1, result2] = await Promise.all([request1, request2]);

            expect(result1).toBeNull(); // First request was aborted
            expect(result2).not.toBeNull(); // Second request succeeded
            expect(result2?.status).toBe(200);
        });

        it('should handle three rapid consecutive requests', async () => {
            const latestFetch = createLatestFetcher();

            let resolve1: (value: Response) => void;
            let resolve2: (value: Response) => void;
            let resolve3: (value: Response) => void;

            const promise1 = new Promise<Response>((resolve) => {
                resolve1 = resolve;
            });
            const promise2 = new Promise<Response>((resolve) => {
                resolve2 = resolve;
            });
            const promise3 = new Promise<Response>((resolve) => {
                resolve3 = resolve;
            });

            vi.mocked(fetch).mockReturnValueOnce(promise1).mockReturnValueOnce(promise2).mockReturnValueOnce(promise3);

            const request1 = latestFetch('/api?q=a');
            const request2 = latestFetch('/api?q=ab');
            const request3 = latestFetch('/api?q=abc');

            resolve1(new Response('1'));
            resolve2(new Response('2'));
            resolve3(new Response('3'));

            const [result1, result2, result3] = await Promise.all([request1, request2, request3]);

            expect(result1).toBeNull();
            expect(result2).toBeNull();
            expect(result3).not.toBeNull();
        });

        it('should handle requests completing out of order', async () => {
            const latestFetch = createLatestFetcher();

            let resolve1: (value: Response) => void;
            let resolve2: (value: Response) => void;

            const promise1 = new Promise<Response>((resolve) => {
                resolve1 = resolve;
            });
            const promise2 = new Promise<Response>((resolve) => {
                resolve2 = resolve;
            });

            vi.mocked(fetch).mockReturnValueOnce(promise1).mockReturnValueOnce(promise2);

            const request1 = latestFetch('/api/slow');
            const request2 = latestFetch('/api/fast');

            // Second request completes first
            resolve2(new Response('fast'));
            const result2 = await request2;
            expect(result2).not.toBeNull();

            // First request completes after being superseded
            resolve1(new Response('slow'));
            const result1 = await request1;
            expect(result1).toBeNull();
        });
    });

    describe('abort behavior', () => {
        it('should abort previous request when new request is made', async () => {
            const latestFetch = createLatestFetcher();
            let capturedSignal1: AbortSignal | undefined;
            let capturedSignal2: AbortSignal | undefined;

            vi.mocked(fetch)
                .mockImplementationOnce((_, init) => {
                    capturedSignal1 = init?.signal;
                    return new Promise(() => {}); // Never resolves
                })
                .mockImplementationOnce((_, init) => {
                    capturedSignal2 = init?.signal;
                    return Promise.resolve(new Response('{}'));
                });

            // Start first request
            latestFetch('/api/first');

            // Verify first signal is not aborted yet
            expect(capturedSignal1?.aborted).toBe(false);

            // Start second request
            await latestFetch('/api/second');

            // Verify first signal was aborted
            expect(capturedSignal1?.aborted).toBe(true);
            // Verify second signal is not aborted
            expect(capturedSignal2?.aborted).toBe(false);
        });

        it('should return null for requests that throw AbortError', async () => {
            const latestFetch = createLatestFetcher();
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';

            let rejectFirst: (error: Error) => void;
            const firstPromise = new Promise<Response>((_, reject) => {
                rejectFirst = reject;
            });

            vi.mocked(fetch).mockReturnValueOnce(firstPromise).mockResolvedValueOnce(new Response('{}'));

            const request1 = latestFetch('/api/first');
            const request2 = latestFetch('/api/second');

            // First request gets aborted
            rejectFirst(abortError);

            const result1 = await request1;
            const result2 = await request2;

            expect(result1).toBeNull();
            expect(result2).not.toBeNull();
        });
    });

    describe('error handling', () => {
        it('should throw errors for the latest request', async () => {
            const latestFetch = createLatestFetcher();
            const networkError = new Error('Network failure');

            vi.mocked(fetch).mockRejectedValueOnce(networkError);

            await expect(latestFetch('/api/data')).rejects.toThrow('Network failure');
        });

        it('should not throw errors for superseded requests', async () => {
            const latestFetch = createLatestFetcher();
            const networkError = new Error('Network failure');

            let rejectFirst: (error: Error) => void;
            const firstPromise = new Promise<Response>((_, reject) => {
                rejectFirst = reject;
            });

            vi.mocked(fetch).mockReturnValueOnce(firstPromise).mockResolvedValueOnce(new Response('{}'));

            const request1 = latestFetch('/api/first');
            const request2 = latestFetch('/api/second');

            // First request fails with network error
            rejectFirst(networkError);

            const result1 = await request1; // Should not throw
            const result2 = await request2;

            expect(result1).toBeNull();
            expect(result2).not.toBeNull();
        });

        it('should handle mixed success and errors', async () => {
            const latestFetch = createLatestFetcher();
            const error = new Error('Server error');

            let resolve1: (value: Response) => void;
            let reject2: (error: Error) => void;

            const promise1 = new Promise<Response>((resolve) => {
                resolve1 = resolve;
            });
            const promise2 = new Promise<Response>((_, reject) => {
                reject2 = reject;
            });

            vi.mocked(fetch).mockReturnValueOnce(promise1).mockReturnValueOnce(promise2);

            const request1 = latestFetch('/api/first');
            const request2 = latestFetch('/api/second');

            resolve1(new Response('success'));
            reject2(error);

            const result1 = await request1;
            await expect(request2).rejects.toThrow('Server error');

            expect(result1).toBeNull(); // Superseded by second request
        });
    });

    describe('real-world scenarios', () => {
        it('should handle autocomplete search scenario', async () => {
            const latestFetch = createLatestFetcher();
            const responses: ((value: Response) => void)[] = [];
            const queries = ['h', 'he', 'hel', 'hell', 'hello'];

            // Mock 5 rapid search requests
            for (let i = 0; i < 5; i++) {
                vi.mocked(fetch).mockReturnValueOnce(
                    new Promise((resolve) => {
                        responses.push(resolve);
                    })
                );
            }

            // Simulate user typing "hello"
            const results = await Promise.all([
                latestFetch('/api/search?q=h'),
                latestFetch('/api/search?q=he'),
                latestFetch('/api/search?q=hel'),
                latestFetch('/api/search?q=hell'),
                latestFetch('/api/search?q=hello'),
            ].map(async (promise, index) => {
                // Resolve in order with delay
                responses[index](new Response(JSON.stringify({query: queries[index]})));
                return promise;
            }));

            // Only the last request should return a response
            expect(results[0]).toBeNull();
            expect(results[1]).toBeNull();
            expect(results[2]).toBeNull();
            expect(results[3]).toBeNull();
            expect(results[4]).not.toBeNull();

            const data = await results[4]?.json();
            expect(data).toEqual({query: 'hello'});
        });

        it('should handle delayed responses correctly', async () => {
            const latestFetch = createLatestFetcher();

            // First request takes 100ms
            const slowPromise = new Promise<Response>((resolve) => {
                setTimeout(() => resolve(new Response('slow')), 100);
            });

            // Second request is immediate
            const fastPromise = Promise.resolve(new Response('fast'));

            vi.mocked(fetch).mockReturnValueOnce(slowPromise).mockReturnValueOnce(fastPromise);

            const slowRequest = latestFetch('/api/slow');
            const fastRequest = latestFetch('/api/fast');

            const [slowResult, fastResult] = await Promise.all([slowRequest, fastRequest]);

            expect(slowResult).toBeNull(); // Superseded even though it was started first
            expect(fastResult).not.toBeNull(); // Latest request
        });
    });

    describe('independent fetcher instances', () => {
        it('should maintain separate state for different instances', async () => {
            const fetcher1 = createLatestFetcher();
            const fetcher2 = createLatestFetcher();

            let resolve1a: (value: Response) => void;
            let resolve1b: (value: Response) => void;
            let resolve2a: (value: Response) => void;
            let resolve2b: (value: Response) => void;

            vi.mocked(fetch)
                .mockReturnValueOnce(new Promise((resolve) => (resolve1a = resolve)))
                .mockReturnValueOnce(new Promise((resolve) => (resolve1b = resolve)))
                .mockReturnValueOnce(new Promise((resolve) => (resolve2a = resolve)))
                .mockReturnValueOnce(new Promise((resolve) => (resolve2b = resolve)));

            // Start requests on both fetchers
            const request1a = fetcher1('/api/fetcher1/first');
            const request1b = fetcher1('/api/fetcher1/second');
            const request2a = fetcher2('/api/fetcher2/first');
            const request2b = fetcher2('/api/fetcher2/second');

            resolve1a(new Response('1a'));
            resolve1b(new Response('1b'));
            resolve2a(new Response('2a'));
            resolve2b(new Response('2b'));

            const [result1a, result1b, result2a, result2b] = await Promise.all([
                request1a,
                request1b,
                request2a,
                request2b,
            ]);

            // Each fetcher should only return its latest request
            expect(result1a).toBeNull();
            expect(result1b).not.toBeNull();
            expect(result2a).toBeNull();
            expect(result2b).not.toBeNull();
        });
    });

    describe('debounce with leading-trailing strategy', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should execute first request immediately and last request after debounce', async () => {
            const latestFetch = createLatestFetcher({debounce: 200, strategy: 'leading-trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('success'));

            // Make all calls synchronously (simulating rapid user typing)
            const requests = [
                latestFetch('/api/search?q=h'),
                latestFetch('/api/search?q=he'),
                latestFetch('/api/search?q=hel'),
                latestFetch('/api/search?q=hell'),
                latestFetch('/api/search?q=hello'),
            ];

            // Run all timers to complete debouncing
            await vi.runAllTimersAsync();

            // Await all results
            const results = await Promise.all(requests);

            expect(results[0]).not.toBeNull(); // Leading edge executes
            expect(results[1]).toBeNull(); // Debounced
            expect(results[2]).toBeNull(); // Debounced
            expect(results[3]).toBeNull(); // Debounced
            expect(results[4]).not.toBeNull(); // Trailing edge executes

            expect(fetch).toHaveBeenCalledTimes(2); // Leading + trailing only
        });

        it('should handle single call with leading-trailing debounce', async () => {
            const latestFetch = createLatestFetcher({debounce: 200, strategy: 'leading-trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('data'));

            const request = latestFetch('/api/data');
            await vi.runAllTimersAsync();
            const result = await request;

            expect(result).not.toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1); // Only leading edge
        });

        it('should execute trailing edge if calls happen during debounce', async () => {
            const latestFetch = createLatestFetcher({debounce: 200, strategy: 'leading-trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('success'));

            // Make all calls synchronously
            const requests = [
                latestFetch('/api?q=a'),
                latestFetch('/api?q=ab'),
                latestFetch('/api?q=abc'),
            ];

            // Advance time to trigger trailing edge
            await vi.runAllTimersAsync();

            const results = await Promise.all(requests);

            expect(results[0]).not.toBeNull(); // Leading edge executes
            expect(results[1]).toBeNull(); // Superseded by request #3
            expect(results[2]).not.toBeNull(); // Trailing edge executes
            expect(fetch).toHaveBeenCalledTimes(2); // Leading + trailing
        });
    });

    describe('debounce with trailing-only strategy', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should only execute last request after debounce period', async () => {
            const latestFetch = createLatestFetcher({debounce: 300, strategy: 'trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('success'));

            const request1 = latestFetch('/api/filter?type=a');
            const request2 = latestFetch('/api/filter?type=b');
            const request3 = latestFetch('/api/filter?type=c');

            // Advance time to trigger trailing execution
            await vi.advanceTimersByTimeAsync(300);
            await vi.runOnlyPendingTimersAsync();

            const [result1, result2, result3] = await Promise.all([request1, request2, request3]);

            expect(result1).toBeNull();
            expect(result2).toBeNull();
            expect(result3).not.toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1); // Only trailing edge
            expect(fetch).toHaveBeenCalledWith('/api/filter?type=c', {signal: expect.any(AbortSignal)});
        });

        it('should reset debounce timer on each new call', async () => {
            const latestFetch = createLatestFetcher({debounce: 300, strategy: 'trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('success'));

            const request1 = latestFetch('/api/data?v=1');

            // Advance time partially
            await vi.advanceTimersByTimeAsync(200);

            // New call resets timer
            const request2 = latestFetch('/api/data?v=2');

            // Advance remaining time for first call (would have been 100ms more)
            await vi.advanceTimersByTimeAsync(100);

            const result1 = await request1;
            expect(result1).toBeNull();
            expect(fetch).not.toHaveBeenCalled(); // Timer was reset

            // Advance full debounce period for second call
            await vi.advanceTimersByTimeAsync(200);
            await vi.runOnlyPendingTimersAsync();

            const result2 = await request2;
            expect(result2).not.toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('debounce with errors', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should handle errors in leading edge request', async () => {
            const latestFetch = createLatestFetcher({debounce: 200, strategy: 'leading-trailing'});
            const error = new Error('Network error');

            vi.mocked(fetch).mockRejectedValueOnce(error).mockResolvedValueOnce(new Response('success'));

            const request1 = latestFetch('/api/fail');
            const request2 = latestFetch('/api/success');

            // Attach error handlers before running timers to prevent unhandled rejections
            const errorPromise = expect(request1).rejects.toThrow('Network error');

            await vi.runAllTimersAsync();

            await errorPromise;

            const result2 = await request2;
            expect(result2).not.toBeNull();
        });

        it('should handle errors in trailing edge request', async () => {
            const latestFetch = createLatestFetcher({debounce: 200, strategy: 'leading-trailing'});
            const error = new Error('Server error');

            vi.mocked(fetch).mockResolvedValueOnce(new Response('ok')).mockRejectedValueOnce(error);

            const request1 = latestFetch('/api/first');
            const request2 = latestFetch('/api/second');

            // Attach error handlers before running timers to prevent unhandled rejections
            const errorPromise = expect(request2).rejects.toThrow('Server error');

            await vi.runAllTimersAsync();

            const result1 = await request1;
            expect(result1).not.toBeNull();

            await errorPromise;
        });
    });

    describe('backward compatibility', () => {
        it('should work with no options (default behavior)', async () => {
            const latestFetch = createLatestFetcher();
            const mockResponse = new Response('data');

            vi.mocked(fetch).mockResolvedValue(mockResponse);

            const result = await latestFetch('/api/data');

            expect(result).toBe(mockResponse);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should work with debounce: 0 (explicit no debounce)', async () => {
            const latestFetch = createLatestFetcher({debounce: 0});
            const mockResponse = new Response('data');

            vi.mocked(fetch).mockResolvedValue(mockResponse);

            const result = await latestFetch('/api/data');

            expect(result).toBe(mockResponse);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple rapid calls without debounce', async () => {
            const latestFetch = createLatestFetcher({debounce: 0});

            let resolve1: (value: Response) => void;
            let resolve2: (value: Response) => void;
            let resolve3: (value: Response) => void;

            vi.mocked(fetch)
                .mockReturnValueOnce(new Promise((resolve) => (resolve1 = resolve)))
                .mockReturnValueOnce(new Promise((resolve) => (resolve2 = resolve)))
                .mockReturnValueOnce(new Promise((resolve) => (resolve3 = resolve)));

            const request1 = latestFetch('/api?q=a');
            const request2 = latestFetch('/api?q=ab');
            const request3 = latestFetch('/api?q=abc');

            resolve1(new Response('1'));
            resolve2(new Response('2'));
            resolve3(new Response('3'));

            const [result1, result2, result3] = await Promise.all([request1, request2, request3]);

            expect(result1).toBeNull();
            expect(result2).toBeNull();
            expect(result3).not.toBeNull();
            expect(fetch).toHaveBeenCalledTimes(3); // All requests made (abort-only)
        });
    });

    describe('debounce real-world scenarios', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should optimize autocomplete with leading-trailing (60% reduction)', async () => {
            const latestFetch = createLatestFetcher({debounce: 200, strategy: 'leading-trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('{"results": []}'));

            // Simulate user typing "react"
            const requests = [
                latestFetch('/api/search?q=r'),
                latestFetch('/api/search?q=re'),
                latestFetch('/api/search?q=rea'),
                latestFetch('/api/search?q=reac'),
                latestFetch('/api/search?q=react'),
            ];

            // Process all timers
            await vi.runAllTimersAsync();

            const results = await Promise.all(requests);

            // First request executes immediately (leading)
            expect(results[0]).not.toBeNull();
            // Middle requests are debounced
            expect(results[1]).toBeNull();
            expect(results[2]).toBeNull();
            expect(results[3]).toBeNull();
            // Last request executes (trailing)
            expect(results[4]).not.toBeNull();

            // Only 2 requests made instead of 5
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenNthCalledWith(1, '/api/search?q=r', expect.any(Object));
            expect(fetch).toHaveBeenNthCalledWith(2, '/api/search?q=react', expect.any(Object));
        });

        it('should optimize filter selection with trailing-only (80% reduction)', async () => {
            const latestFetch = createLatestFetcher({debounce: 300, strategy: 'trailing'});

            vi.mocked(fetch).mockResolvedValue(new Response('{"items": []}'));

            // Simulate user clicking through 5 filters quickly
            const requests = [
                latestFetch('/api/items?filter=category'),
                latestFetch('/api/items?filter=price'),
                latestFetch('/api/items?filter=brand'),
                latestFetch('/api/items?filter=rating'),
                latestFetch('/api/items?filter=availability'),
            ];

            await vi.runAllTimersAsync();

            const results = await Promise.all(requests);

            // All except last return null
            expect(results[0]).toBeNull();
            expect(results[1]).toBeNull();
            expect(results[2]).toBeNull();
            expect(results[3]).toBeNull();
            expect(results[4]).not.toBeNull();

            // Only 1 request made instead of 5
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith('/api/items?filter=availability', expect.any(Object));
        });
    });
});


