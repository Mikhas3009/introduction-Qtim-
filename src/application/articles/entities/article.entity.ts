import { UserEntity } from 'src/application/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'articles' })
@Index('idx_articles_author_created_at', ['author', 'createdAt'])
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'article_id' })
  id: string;

  @Column({ name: 'article_name', unique: false, nullable: false })
  name: string;

  @Column({
    name: 'article_description',
    type: 'text',
    unique: false,
    nullable: true,
  })
  description: string;

  @ManyToOne(() => UserEntity, (u) => u.articles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index('idx_articles_author_id')
  authorId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
