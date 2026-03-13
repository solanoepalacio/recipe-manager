import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { Prisma } from '@prisma/client';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';

function makeException(code: string) {
  return new Prisma.PrismaClientKnownRequestError('error', {
    code,
    clientVersion: '0.0.0',
  });
}

function makeHost(status: jest.Mock, json: jest.Mock) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: status.mockReturnValue({ json }),
      }),
    }),
  } as unknown as ArgumentsHost;
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn();
  });

  it('maps P2025 to 404', () => {
    filter.catch(makeException('P2025'), makeHost(statusMock, jsonMock));
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 })
    );
  });

  it('maps P2002 to 409', () => {
    filter.catch(makeException('P2002'), makeHost(statusMock, jsonMock));
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 })
    );
  });
});
