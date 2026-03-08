import getSearchByKey from '../../../../module/apis/search/getSearchByKey';
import c_y_common from '../../../../module/apis/u_common';
import { handleApi } from '../../../../util/apiResponse';

jest.mock('../../../../module/apis/u_common');
jest.mock('../../../../util/apiResponse');

describe('module/apis/search/getSearchByKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (handleApi as jest.Mock).mockImplementation((promise) => promise);
  });

  test('should be a function', () => {
    expect(typeof getSearchByKey).toBe('function');
  });

  test('should call c_y_common with correct URL', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });

    await getSearchByKey({ method: 'get', params: {}, option: {} });

    expect(c_y_common).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/soso/fcgi-bin/client_search_cp'
      })
    );
  });

  test('should use default method get when not provided', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });

    await getSearchByKey({ params: {}, option: {} });

    expect(c_y_common).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get'
      })
    );
  });

  test('should pass key param to c_y_common', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });

    await getSearchByKey({
      method: 'get',
      params: { key: 'test music' },
      option: {}
    });

    expect(c_y_common).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          params: expect.objectContaining({
            w: 'test music'
          })
        })
      })
    );
  });

  test('should add default params', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });

    await getSearchByKey({
      method: 'get',
      params: { key: 'test' },
      option: {}
    });

    const callArgs = (c_y_common as jest.Mock).mock.calls[0][0];
    expect(callArgs.options.params).toMatchObject({
      w: 'test',
      format: 'json',
      outCharset: 'utf-8',
      n: 20,
      p: 1
    });
  });

  test('should allow overriding n and p params', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });

    await getSearchByKey({
      method: 'get',
      params: { key: 'test', n: 50, p: 3 },
      option: {}
    });

    const callArgs = (c_y_common as jest.Mock).mock.calls[0][0];
    expect(callArgs.options.params).toMatchObject({
      w: 'test',
      n: 50,
      p: 3
    });
  });

  test('should merge custom options', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });
    const customOption = { timeout: 10000 };

    await getSearchByKey({
      method: 'get',
      params: { key: 'test' },
      option: customOption
    });

    const callArgs = (c_y_common as jest.Mock).mock.calls[0][0];
    expect(callArgs.options).toMatchObject({
      timeout: 10000,
      params: expect.any(Object)
    });
  });

  test('should call handleApi with c_y_common promise', async () => {
    const mockResponse = { data: { code: 0, data: { song: {} } } };
    (c_y_common as jest.Mock).mockResolvedValue(mockResponse);
    (handleApi as jest.Mock).mockResolvedValue({ status: 200, body: mockResponse });

    const result = await getSearchByKey({ method: 'get', params: { key: 'test' }, option: {} });

    expect(handleApi).toHaveBeenCalledWith(expect.any(Promise));
    expect(result).toEqual({ status: 200, body: mockResponse });
  });

  test('should handle empty key', async () => {
    (c_y_common as jest.Mock).mockResolvedValue({ data: { code: 0, data: {} } });

    await getSearchByKey({ method: 'get', params: { key: '' }, option: {} });

    const callArgs = (c_y_common as jest.Mock).mock.calls[0][0];
    expect(callArgs.options.params.w).toBe('');
  });
});
