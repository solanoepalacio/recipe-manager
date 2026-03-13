import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

describe('ValidationPipe configuration', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('passes valid input', async () => {
    const result = await pipe.transform({ name: 'test' }, { type: 'body', metatype: TestDto });
    expect(result.name).toBe('test');
  });

  it('rejects invalid input', async () => {
    await expect(
      pipe.transform({ name: '' }, { type: 'body', metatype: TestDto })
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects extra fields when forbidNonWhitelisted is true', async () => {
    await expect(
      pipe.transform(
        { name: 'test', extra: 'field' },
        { type: 'body', metatype: TestDto }
      )
    ).rejects.toThrow(BadRequestException);
  });
});
