import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ArticleEntity } from 'src/application/articles/entities/article.entity';
import {
  applyArticleFilters,
  applyArticleSort,
  applyPagination,
} from 'src/application/articles/helpers/apply-article-query';
import { ArticleNotFoundException } from 'src/application/articles/exceptions/articleNotFound.exception';
import { ArticlesService } from 'src/application/articles/services/articles.service';

jest.mock('src/application/articles/helpers/apply-article-query', () => ({
  applyArticleFilters: jest.fn(),
  applyArticleSort: jest.fn(),
  applyPagination: jest.fn(),
}));

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
type QB = Partial<Record<keyof SelectQueryBuilder<any>, jest.Mock>> & {
  getMany: jest.Mock;
};

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repo: jest.Mocked<Repository<ArticleEntity>>;

  beforeEach(async () => {
    const repoMock: MockRepo<ArticleEntity> = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      // важное отличие: используем softDelete, как в сервисе
      softDelete: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(ArticleEntity), useValue: repoMock },
      ],
    }).compile();

    service = module.get(ArticlesService);
    repo = module.get(getRepositoryToken(ArticleEntity));
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('применяет фильтры/сортировку/пагинацию и возвращает getMany', async () => {
      const qb: QB = {
        getMany: jest
          .fn()
          .mockResolvedValue([{ id: 'uuid-a1' }, { id: 'uuid-a2' }]),
      } as any;

      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const query = { page: 1, limit: 20, sort: 'createdAt:desc' } as any;
      const result = await service.list(query);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('a');
      expect(applyArticleFilters).toHaveBeenCalledWith(qb, query);
      expect(applyArticleSort).toHaveBeenCalledWith(qb, query);
      expect(applyPagination).toHaveBeenCalledWith(qb, query);
      expect(qb.getMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'uuid-a1' }, { id: 'uuid-a2' }]);
    });
  });

  describe('show', () => {
    it('возвращает статью, если найдена', async () => {
      const article = {
        id: '7b8c7d48-2a4c-4c90-8e23-1d3c2f1b5c00',
        name: 'Hello',
      } as ArticleEntity;
      (repo.findOne as jest.Mock).mockResolvedValue(article);

      const res = await service.show({ id: article.id } as any);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: article.id, deletedAt: null },
      });
      expect(res).toBe(article);
    });

    it('бросает ArticleNotFoundException, если не найдена', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.show({ id: '00000000-0000-0000-0000-000000000000' } as any),
      ).rejects.toBeInstanceOf(ArticleNotFoundException);
    });
  });

  describe('store', () => {
    it('создаёт и сохраняет статью, подставляя authorId из author.id', async () => {
      const body = {
        name: 'New',
        description: '...',
        author: { id: 'c3d5de2f-9e5a-44a0-8f2a-07f6c9b3b5ba' },
      } as any;

      const creatable = {
        name: 'New',
        description: '...',
        authorId: body.author.id,
      };
      const saved = { id: 'art-uuid', ...creatable } as ArticleEntity;

      (repo.create as jest.Mock).mockReturnValue(creatable);
      (repo.save as jest.Mock).mockResolvedValue(saved);

      const res = await service.store(body);

      expect(repo.create).toHaveBeenCalledWith({
        name: 'New',
        description: '...',
        authorId: body.author.id,
      });
      expect(repo.save).toHaveBeenCalledWith(creatable);
      expect(res).toBe(saved);
    });
  });

  describe('delete', () => {
    it('возвращает { success: true }, если affected > 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 1 });

      const res = await service.delete({
        id: '5c8c7d48-2a4c-4c90-8e23-1d3c2f1b5c11',
      } as any);

      expect(repo.softDelete).toHaveBeenCalledWith(
        '5c8c7d48-2a4c-4c90-8e23-1d3c2f1b5c11',
      );
      expect(res).toEqual({ success: true });
    });

    it('бросает ArticleNotFoundException, если affected = 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 0 });

      await expect(
        service.delete({ id: 'no-such-id' } as any),
      ).rejects.toBeInstanceOf(ArticleNotFoundException);
    });
  });

  describe('update', () => {
    it('обновляет статью и возвращает сущность', async () => {
      (repo.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const body = { name: 'Upd', description: '...' } as any;
      const param = { id: '8f8c7d48-2a4c-4c90-8e23-1d3c2f1b5c22' } as any;

      const updated = {
        id: param.id,
        name: 'Upd',
        description: '...',
        deletedAt: null,
      } as ArticleEntity;
      (repo.findOne as jest.Mock).mockResolvedValue(updated);

      const res = await service.update(body, param);

      expect(repo.update).toHaveBeenCalledWith(param.id, body);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: param.id, deletedAt: null },
      });
      expect(res).toBe(updated);
    });

    it('бросает ArticleNotFoundException, если запись не найдена', async () => {
      (repo.update as jest.Mock).mockResolvedValue({ affected: 0 });

      const body = { name: 'Upd' } as any;
      const param = { id: '8f8c7d48-2a4c-4c90-8e23-1d3c2f1b5c22' } as any;

      await expect(service.update(body, param)).rejects.toBeInstanceOf(
        ArticleNotFoundException,
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });
});
