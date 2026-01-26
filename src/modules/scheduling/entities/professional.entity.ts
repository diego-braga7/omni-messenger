import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('professionals')
export class Professional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column({ name: 'calendar_id' })
  calendarId: string;

  @Column({ name: 'google_access_token', nullable: true, type: 'varchar' })
  googleAccessToken: string | null;

  @Column({ name: 'google_refresh_token', nullable: true, type: 'varchar' })
  googleRefreshToken: string | null;

  @Column({ name: 'google_token_expiry', type: 'bigint', nullable: true })
  googleTokenExpiry: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.professional)
  appointments: Appointment[];
}
