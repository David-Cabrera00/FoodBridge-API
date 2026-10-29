import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'food_publications' })
export class FoodPublication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  establishmentId: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'timestamptz', nullable: true })
  expirationDate?: Date;

  @Column({ type: 'varchar', length: 50, default: 'available' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

