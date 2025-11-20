import { z } from 'zod';

export const pagingSchema = z.object({
  page: z.coerce.number().min(1, { message: 'Page number must be at least 1' }).default(1),
  limit: z.coerce.number().min(1, { message: 'Limit must be at least 1' }).max(100).default(20),
  sort: z.string().optional(),
  order: z.string().optional(),
});
export interface PagingType extends z.infer<typeof pagingSchema> {
  total?: number;
}

export type Paginated<E> = {
  data: E[];
  paging: PagingType;
  total: number;
};
