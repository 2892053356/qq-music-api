jest.mock('axios', () => {
	const service = jest.fn(config => Promise.resolve({ data: {}, config }));
	service.interceptors = {
		request: { use: jest.fn() },
		response: { use: jest.fn() }
	};
	return {
		create: jest.fn(() => service),
		defaults: { headers: { post: {} } }
	};
});

describe('request util', () => {
	const defaultUserAgent =
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

	let axios;
	let request;
	let mockService;
	let requestInterceptor;

	beforeEach(() => {
		jest.resetModules();
		axios = require('axios');
		mockService = axios.create();
		global.userInfo = { cookie: 'test_cookie=123' };

		const requestModule = require('../../../util/request');
		request = requestModule.default || requestModule;
		requestInterceptor = mockService.interceptors.request.use.mock.calls[0][0];
	});

	afterEach(() => {
		delete global.userInfo;
	});

	test('should make GET request', async () => {
		await request('/api/test', 'GET');
		expect(mockService).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/api/test'),
				method: 'get'
			})
		);
	});

	test('should handle request error', async () => {
		const error = new Error('Network Error');
		mockService.mockRejectedValue(error);

		await expect(request('/api/test', 'GET')).rejects.toThrow();
	});

	test('should set correct headers', async () => {
		await request('/api/test', 'GET', { headers: { 'Custom-Header': 'value' } });

		const call = mockService.mock.calls[0][0];
		expect(call.headers).toBeDefined();
		expect(call.headers.Cookie).toBe('test_cookie=123');
		expect(call.headers['Custom-Header']).toBe('value');
	});

	test('should set default User-Agent header', async () => {
		await request('/api/test', 'GET', { headers: {} });

		const interceptedConfig = requestInterceptor(mockService.mock.calls[0][0]);
		expect(interceptedConfig.headers['User-Agent']).toBe(defaultUserAgent);
	});

	test('should set default Content-Type for POST requests with body', async () => {
		await request('/api/test', 'POST', { data: { foo: 'bar' }, headers: {} });

		const interceptedConfig = requestInterceptor(mockService.mock.calls[0][0]);
		expect(interceptedConfig.method).toBe('post');
		expect(interceptedConfig.headers['Content-Type']).toBe('application/x-www-form-urlencoded; charset=UTF-8');
	});
});
