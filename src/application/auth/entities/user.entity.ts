import { ArticleEntity } from 'src/application/articles/entities/article.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id: string;

  @Column({ name: 'user_login', nullable: false, unique: true })
  login: string;

  @Column({ name: 'user_password', nullable: false, unique: false })
  password: string;

  @Column({ name: 'user_name', nullable: false, unique: false })
  name: string;

  @OneToMany(() => ArticleEntity, (a) => a.author)
  articles: ArticleEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
