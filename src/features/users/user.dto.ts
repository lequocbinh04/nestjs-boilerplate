import { createZodDto } from 'nestjs-zod';
import { GetMeResSchema } from './user.model';

export class GetMeResDTO extends createZodDto(GetMeResSchema) {}
