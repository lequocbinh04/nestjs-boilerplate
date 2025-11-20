import { pagingSchema } from '@common/models/paging.model';
import { createZodDto } from 'nestjs-zod';

export const pagingDto = createZodDto(pagingSchema);
