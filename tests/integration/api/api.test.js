const request = require('supertest');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const routerModule = require('../../../routers/router');
const corsModule = require('../../../middlewares/koa-cors');

const router = routerModule.default || routerModule;
const cors = corsModule.default || corsModule;

jest.mock('axios', () => {
	const mockFn = jest.fn().mockResolvedValue({ data: { code: 0, data: {} } });
	mockFn.interceptors = {
		request: { use: jest.fn() },
		response: { use: jest.fn() },
	};
	return {
		get: mockFn,
		post: mockFn,
		create: jest.fn(() => mockFn),
		defaults: {
			withCredentials: true,
			timeout: 10000,
			headers: { post: {} },
			responseType: 'json',
		},
	};
});

const axios = require('axios');

function createTestApp() {
	const app = new Koa();
	app.use(cors());
	app.use(bodyParser());
	app.use(router.routes());
	app.use(router.allowedMethods());
	return app;
}

describe('API Integration Tests', () => {
	let app;
	let callback;
	let mockService;

	beforeAll(() => {
		app = createTestApp();
		callback = app.callback();
		mockService = axios.create();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockService.mockResolvedValue({ data: { code: 0, data: {} } });
		global.userInfo = { cookie: 'test_cookie=123' };
	});

	describe('GET /getHotkey', () => {
		test('should return hot search keywords', async () => {
			const response = await request(callback).get('/getHotkey').expect(200);
			expect(response.body).toBeDefined();
		}, 10000);
	});

	describe('GET /getTopLists', () => {
		test('should return top lists', async () => {
			const response = await request(callback).get('/getTopLists').expect(200);
			expect(response.body).toBeDefined();
		}, 10000);
	});

	describe('GET /getSearchByKey', () => {
		test('should search with query param', async () => {
			const response = await request(callback)
				.get('/getSearchByKey')
				.query({ key: 'test' })
				.expect(200);
			expect(response.body).toBeDefined();
		}, 10000);

		test('should search with path param (backward compatibility)', async () => {
			const response = await request(callback).get('/getSearchByKey/test').expect(200);
			expect(response.body).toBeDefined();
		}, 10000);
	});

	describe('GET /getLyric', () => {
		test('should return lyric with query param', async () => {
			const response = await request(callback)
				.get('/getLyric')
				.query({ songmid: 'test123' })
				.expect(200);
			expect(response.body).toBeDefined();
		}, 10000);
	});

	describe('POST /batchGetSongInfo', () => {
		test('should batch get song info', async () => {
			const response = await request(callback)
				.post('/batchGetSongInfo')
				.send({ songs: [['test1', '1'], ['test2', '2']] })
				.expect(200);
			expect(response.body).toBeDefined();
			expect(mockService).toHaveBeenCalledTimes(2);
		}, 10000);
	});

	describe('Error handling', () => {
		test('should return 404 for unknown route', async () => {
			await request(callback).get('/unknown-route').expect(404);
		});

		test('should return 400 for missing search key', async () => {
			const response = await request(callback).get('/getSearchByKey').expect(400);
			expect(response.body.response).toBe('search key is null');
		});

		test('should return 500 when downstream request rejects', async () => {
			mockService.mockRejectedValueOnce(new Error('downstream failure'));
			const response = await request(callback).get('/getHotkey').expect(500);
			expect(response.body.error).toBeDefined();
		});

		test('should preserve non-success business response code from downstream', async () => {
			mockService.mockResolvedValueOnce({ data: { code: 1, message: 'mock business error' } });
			const response = await request(callback).get('/getHotkey').expect(200);
			expect(response.body.response).toEqual({ code: 1, message: 'mock business error' });
		});
	});

	describe('CORS middleware', () => {
		test('should set CORS headers', async () => {
			const response = await request(callback).get('/getHotkey').expect(200);
			expect(response.headers['access-control-allow-origin']).toBeDefined();
		});
	});
});
