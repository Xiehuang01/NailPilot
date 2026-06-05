import type { ResultSetHeader } from 'mysql2';
import { getDb } from '../config/db.js';

type CreateBookingInput = {
  nickname?: string;
  shopId: string;
  styleId: number;
  time?: string;
};

export const createBooking = async ({ shopId, styleId, time = 'none', nickname = 'DemoUser' }: CreateBookingInput) => {
  const db = getDb();
  const [result] = await db.query<ResultSetHeader>(
    `
      INSERT INTO bookings (shop_id, style_id, booking_time, nickname, status)
      VALUES (?, ?, ?, ?, 'demo_confirmed')
    `,
    [shopId, styleId, time, nickname],
  );

  return {
    success: true,
    bookingId: result.insertId,
    message: '预约成功，本次为 Demo 模拟预约，不产生真实订单。',
  };
};
