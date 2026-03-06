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
		response: { use: jest.fn() }
	};
	return {
		get: mockFn,
		post: mockFn,
		create: jest.fn(() => mockFn),
		defaults: {
			withCredentials: true,
			timeout: 10000,
			headers: { post: {} },
			responseType: 'json'
		}
	};
});

const axios = require('axios');

const createFetchResponse = ({
	ok = true,
	text = '',
	arrayBuffer = Buffer.from(''),
	headers = {},
	status = 200
} = {}) => ({
	ok,
	status,
	text: async () => text,
	arrayBuffer: async () => arrayBuffer,
	headers: {
		get: name => {
			const matchedKey = Object.keys(headers).find(key => key.toLowerCase() === String(name).toLowerCase());
			return matchedKey ? headers[matchedKey] : null;
		}
	}
});

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
		global.fetch = jest.fn();
	});

	afterEach(() => {
		delete global.fetch;
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

	describe('QQ QR login endpoints', () => {
		test('GET /getQQLoginQr should return base64 QR and ptqrtoken/qrsig', async () => {
			const qrBuffer = Buffer.from('fake-qr-image-bytes');
			global.fetch.mockResolvedValueOnce(
				createFetchResponse({
					arrayBuffer: qrBuffer,
					headers: {
						'Set-Cookie': 'qrsig=mockQrSig; Path=/; HttpOnly'
					}
				})
			);

			const response = await request(callback).get('/getQQLoginQr').expect(200);

			expect(response.body.img).toBe(`data:image/png;base64,${qrBuffer.toString('base64')}`);
			expect(response.body.ptqrtoken).toBeDefined();
			expect(response.body.qrsig).toBe('mockQrSig');
		});

		test('POST /checkQQLoginQr should return 400 when ptqrtoken/qrsig are missing', async () => {
			const response = await request(callback).post('/checkQQLoginQr').send({}).expect(400);

			expect(response.body.error).toBe('参数错误');
		});

		test('POST /checkQQLoginQr should return session on success', async () => {
			global.fetch
				.mockResolvedValueOnce(
					createFetchResponse({
						text: "ptuiCB('0','0','登录成功！','https://ssl.ptlogin2.qq.com/check_sig?uin=123456789','0','0');",
						headers: {
							'Set-Cookie': 'pt_login_sig=abc123; Path=/; HttpOnly'
						}
					})
				)
				.mockResolvedValueOnce(
					createFetchResponse({
						headers: {
							'Set-Cookie': 'p_skey=mockPSkey; Path=/; HttpOnly, uin=o123456789; Path=/; HttpOnly'
						}
					})
				)
				.mockResolvedValueOnce(
					createFetchResponse({
						headers: {
							Location: 'https://y.qq.com/portal/wx_redirect.html?code=mockAuthCode',
							'Set-Cookie': 'graph_key=graphValue; Path=/; HttpOnly'
						}
					})
				)
				.mockResolvedValueOnce(
					createFetchResponse({
						headers: {
							'Set-Cookie': 'qm_keyst=finalValue; Path=/; HttpOnly'
						}
					})
				);

			const response = await request(callback)
				.post('/checkQQLoginQr')
				.send({ ptqrtoken: 'mockToken', qrsig: 'mockQrSig' })
				.expect(200);

			expect(response.body.isOk).toBe(true);
			expect(response.body.message).toBe('登录成功');
			expect(response.body.session).toBeDefined();
			expect(response.body.session.loginUin).toBe('o123456789');
			expect(response.body.session.cookie).toContain('uin=o123456789');
			expect(response.body.session.cookie).toContain('qm_keyst=finalValue');
			expect(Array.isArray(response.body.session.cookieList)).toBe(true);
			expect(response.body.session.cookieList.length).toBeGreaterThan(0);
			expect(response.body.session.cookieObject).toMatchObject({
				uin: 'o123456789',
				p_skey: 'mockPSkey',
				qm_keyst: 'finalValue'
			});
		});

		test('GET /getQQLoginQr should map upstream failure to 502', async () => {
			global.fetch.mockRejectedValueOnce(new Error('network timeout'));

			const response = await request(callback).get('/getQQLoginQr').expect(502);

			expect(response.body.error).toBe('Failed to fetch QQ login QR');
		});
	});

	describe('CORS middleware', () => {
		test('should set CORS headers', async () => {
			const response = await request(callback).get('/getHotkey').expect(200);
			expect(response.headers['access-control-allow-origin']).toBeDefined();
		});
	});
});
