import pool from '@/lib/db';
import { PaymentMethod, PaymentStatus } from '@/lib/types/enums';
import { BookingStatus } from '@/lib/types/enums';
import { emailService } from './email.service';
import { customerNotificationService } from './customer-notification.service';
import { getAppSettings } from './settings.service';
import { RowDataPacket, PoolConnection, ResultSetHeader } from 'mysql2/promise';

// Define types for query results
type PaymentRow = RowDataPacket & {
  id: string;
  booking_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  gateway_response?: string;
  transaction_id?: string;
  admin_commission: number;
  vendor_amount: number;
  tax_amount: number;
};

type BookingRow = RowDataPacket & {
  id: string;
  hotelId: string;
  hotelName: string;
  vendorId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  checkInDate: Date;
  checkOutDate: Date;
};

// Add utility functions for transaction handling
const beginTransaction = async (): Promise<PoolConnection> => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

const commitTransaction = async (connection: PoolConnection): Promise<void> => {
  await connection.commit();
  connection.release();
};

const rollbackTransaction = async (connection: PoolConnection): Promise<void> => {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
};

export const paymentService = {
  /**
   * Initialize payment for a booking
   */
  async initializePayment({
    bookingId,
    customerId,
    method,
    callbackUrl,
  }: {
    bookingId: string;
    customerId: string;
    method: PaymentMethod;
    callbackUrl: string;
  }) {
    // Get booking details
    const [bookingRows] = await pool.query<BookingRow[]>(`
      SELECT b.*, b.paymentStatus AS paymentStatus, h.id AS hotelId, h.name AS hotelName, h.vendorId AS vendorId,
             c.id AS customerId, u.name AS customerName, u.email AS customerEmail
      FROM bookings b
      LEFT JOIN hotels h ON b.hotelId = h.id
      LEFT JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      WHERE b.id = ?
    `, [bookingId]);
    
    const booking = bookingRows[0];

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify booking is not already paid
    if (booking.paymentStatus === PaymentStatus.COMPLETED) {
      throw new Error('Booking is already paid');
    }

    // Check if payment already exists
    const [existingPayments] = await pool.query<PaymentRow[]>(`
      SELECT * FROM payments
      WHERE booking_id = ? AND status IN (?, ?)
    `, [bookingId, PaymentStatus.PENDING, PaymentStatus.COMPLETED]);

    if (existingPayments.length > 0) {
      throw new Error('Payment already initiated for this booking');
    }

    // Get hotel payment settings
    const [hotelPaymentSettings] = await pool.query<RowDataPacket[]>(`
      SELECT taxRate AS taxRate, commissionRate AS commissionRate
      FROM hotel_payment_settings
      WHERE hotelId = ?
    `, [booking.hotelId]);

    const settings = hotelPaymentSettings[0];
    if (!settings) {
      throw new Error('Hotel payment settings not found');
    }

    // Get Paystack credentials from app settings
    const appSettings = await getAppSettings();
    const [paystackConfigRows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM paystack_configurations
      WHERE isDefault = TRUE
      LIMIT 1
    `);
    
    const paystackConfig = paystackConfigRows[0];
    if (!paystackConfig) {
      throw new Error('Paystack configuration not found');
    }

    // Calculate tax and commission
    const taxRate = settings.taxRate || appSettings?.defaultTaxRate || 5; // Default to 5%
    const commissionRate =
      settings.commissionRate || appSettings?.defaultCommissionRate || 10; // Default to 10%

    const totalAmount = booking.totalAmount;
    const taxAmount = (totalAmount * taxRate) / 100;
    const adminCommission = (totalAmount * commissionRate) / 100;
    const vendorAmount = totalAmount - taxAmount - adminCommission;

    // Create payment record
    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO payments
      (booking_id, customer_id, amount, currency, payment_method, status, admin_commission, vendor_amount, tax_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bookingId, 
      customerId, 
      totalAmount, 
      'NGN', 
      method, 
      PaymentStatus.PENDING,
      adminCommission,
      vendorAmount,
      taxAmount
    ]);
    
    const paymentId = result.insertId;
    const payment = {
      id: paymentId,
      bookingId,
      customerId,
      amount: totalAmount,
      currency: 'NGN',
      method,
      status: PaymentStatus.PENDING,
      adminCommission,
      vendorAmount,
      taxAmount
    };

    // Initialize Paystack transaction
    let paystackResponse;
    switch (method) {
      case PaymentMethod.PAYSTACK:
        // Initialize Paystack payment
        const paystack = require('paystack')(paystackConfig.secretKey);
        paystackResponse = await paystack.transaction.initialize({
          amount: Math.round(totalAmount * 100), // Amount in kobo
          email: booking.customerEmail,
          reference: `qaras-${bookingId}-${Date.now()}`,
          callback_url: callbackUrl,
          metadata: {
            bookingId,
            paymentId,
            customerId,
            customerName: booking.customerName,
            hotelName: booking.hotelName,
          },
        });

        // Save paystack response to payment
        await pool.query(`
          UPDATE payments
          SET transaction_id = ?, gateway_response = ?
          WHERE id = ?
        `, [
          paystackResponse.data.reference,
          JSON.stringify(paystackResponse.data),
          paymentId
        ]);
        break;

      case PaymentMethod.FLUTTERWAVE:
        // Implementation for Flutterwave
        throw new Error('Flutterwave payment not implemented yet');
        break;

      default:
        throw new Error(`Payment method ${method} not supported for online payment`);
    }

    return {
      payment,
      authorizationUrl: paystackResponse?.data?.authorization_url,
      reference: paystackResponse?.data?.reference,
    };
  },

  /**
   * Verify payment and update records
   */
  async verifyPayment(reference: string) {
    // Find the payment record
    const [paymentRows] = await pool.query<PaymentRow[]>(`
      SELECT p.*, b.id AS bookingId, h.name AS hotelName, h.id AS hotelId, h.address AS hotelAddress,
             h.phone AS hotelPhone, h.email AS hotelEmail,
             u.name AS customerName, u.email AS customerEmail,
             b.checkInDate AS checkInDate, b.checkOutDate AS checkOutDate,
             ru.id AS roomUnitId, r.name AS roomName
      FROM payments p
      LEFT JOIN bookings b ON p.bookingId = b.id
      LEFT JOIN hotels h ON b.hotelId = h.id
      LEFT JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      LEFT JOIN room_units ru ON b.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      WHERE p.transactionId = ?
    `, [reference]);
    
    if (!paymentRows || paymentRows.length === 0) {
      throw new Error('Payment not found');
    }
    
    const payment = paymentRows[0];

    // Get Paystack credentials
    const [paystackConfigRows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM paystack_configurations
      WHERE is_default = TRUE
      LIMIT 1
    `);
    
    if (!paystackConfigRows || paystackConfigRows.length === 0) {
      throw new Error('Paystack configuration not found');
    }
    
    const paystackConfig = paystackConfigRows[0];

    // Verify payment with Paystack
    const paystack = require('paystack')(paystackConfig.secretKey);
    const response = await paystack.transaction.verify(reference);

    // Process verification response
    if (response.data.status === 'success') {
      // Update payment and booking in a transaction
      let connection: PoolConnection | null = null;
      try {
        connection = await beginTransaction();

        // Update payment record
        await connection.query(`
          UPDATE payments
          SET status = ?, gateway_response = ?
          WHERE id = ?
        `, [
          PaymentStatus.COMPLETED,
          JSON.stringify(response.data),
          payment.id
        ]);

        // Update booking payment status
        await connection.query(`
          UPDATE bookings
          SET paymentStatus = ?, status = ?
          WHERE id = ?
        `, [
          PaymentStatus.COMPLETED,
          BookingStatus.CONFIRMED,
          payment.bookingId
        ]);

        await commitTransaction(connection);
      } catch (error: any) {
        if (connection) await rollbackTransaction(connection);
        console.error('Transaction error:', error.message);
        throw error;
      }

      // Send payment receipt email
      try {
        // Create booking details object for email
        const bookingDetails = {
          id: payment.booking_id,
          bookingReference: payment.transaction_id || payment.id,
          checkInDate: payment.checkInDate,
          checkOutDate: payment.checkOutDate,
          roomType: payment.roomName || 'Standard Room',
          guestCount: 1, // Default if not available
          currencySymbol: payment.currency === 'NGN' ? '₦' : '$',
          totalAmount: payment.amount,
          paymentStatus: PaymentStatus.COMPLETED
        };

        // Create hotel details object for email
        const hotelDetails = {
          name: payment.hotelName || 'Qaras Hotel',
          address: payment.hotelAddress || 'N/A',
          phone: payment.hotelPhone || 'N/A',
          email: payment.hotelEmail || 'support@qarashotels.com',
          cancellationPolicy: '24 hours before check-in'
        };

        await emailService.sendBookingConfirmation({
          to: payment.customerEmail,
          guestName: payment.customerName,
          bookingDetails,
          hotelDetails
        });

        // Send payment confirmation notification
        await customerNotificationService.sendPaymentNotification('completed', {
          paymentId: payment.id,
          bookingId: payment.booking_id,
          customerId: payment.customer_id,
          userId: payment.customer_id, // Assuming customer_id is the userId
          amount: payment.amount,
          status: 'COMPLETED',
          hotelName: payment.hotelName,
          paymentMethod: payment.payment_method
        });
      } catch (error: any) {
        console.error('Failed to send payment receipt email:', error.message);
        // We don't want to fail the payment verification if email fails
      }

      return {
        success: true,
        payment,
        message: 'Payment verification successful',
      };
    }
    
    // Payment verification failed
    await pool.query(`
      UPDATE payments
      SET status = ?, gateway_response = ?
      WHERE id = ?
    `, [
      PaymentStatus.FAILED,
      JSON.stringify(response.data),
      payment.id
    ]);

    return {
      success: false,
      message: 'Payment verification failed',
      data: response.data,
    };
  },

  /**
   * Process Paystack webhook
   */
  async processPaystackWebhook(event: string, data: any) {
    // Handle charge.success event
    if (event === 'charge.success') {
      const reference = data.reference;
      const [failedPaymentRows] = await pool.query<PaymentRow[]>(`
        SELECT * FROM payments
        WHERE transaction_id = ? AND status = ?
      `, [reference, PaymentStatus.FAILED]);
      
      // If payment was previously marked as failed, update it
      if (failedPaymentRows && failedPaymentRows.length > 0) {
        const failedPayment = failedPaymentRows[0];
        await pool.query(`
          UPDATE payments
          SET status = ?, gateway_response = ?
          WHERE id = ?
        `, [
          PaymentStatus.COMPLETED,
          JSON.stringify(data),
          failedPayment.id
        ]);

        return { success: true, message: 'Payment updated from webhook' };
      }

      // Otherwise, verify the payment
      try {
        const result = await this.verifyPayment(reference);
        return result;
      } catch (error: any) {
        console.error('Error processing webhook payment verification:', error.message);
        return { success: false, error: error.message };
      }
    }

    return { success: true, message: 'Webhook received but no action taken' };
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string) {
    const [paymentRows] = await pool.query<PaymentRow[]>(`
      SELECT p.*, b.id AS bookingId, b.checkInDate AS checkInDate, b.checkOutDate AS checkOutDate,
             b.numberOfGuests AS numberOfGuests, b.totalAmount AS totalAmount, b.status AS paymentStatus,
             h.id AS hotelId, h.name AS hotelName, ru.id AS roomUnitId, r.name AS roomName, r.type AS roomType
      FROM payments p
      LEFT JOIN bookings b ON p.bookingId = b.id
      LEFT JOIN hotels h ON b.hotelId = h.id
      LEFT JOIN room_units ru ON b.roomUnitId = ru.id
      LEFT JOIN rooms r ON ru.roomId = r.id
      WHERE p.id = ?
    `, [id]);

    if (!paymentRows || paymentRows.length === 0) {
      throw new Error('Payment not found');
    }

    const paymentData = paymentRows[0];
    return {
      ...paymentData,
      gatewayResponse: paymentData.gateway_response
        ? JSON.parse(paymentData.gateway_response)
        : null,
    };
  },

  /**
   * Get payments for a booking
   */
  async getBookingPayments(bookingId: string) {
    const [payments] = await pool.query<PaymentRow[]>(`
      SELECT p.*, h.name AS hotelName
      FROM payments p
      LEFT JOIN bookings b ON p.bookingId = b.id
      LEFT JOIN hotels h ON b.hotelId = h.id
      WHERE b.id = ?
    `, [bookingId]);

    return payments.map((payment) => ({
      ...payment,
      gatewayResponse: payment.gateway_response
        ? JSON.parse(payment.gateway_response)
        : null,
    }));
  },

  /**
   * Record a cash payment
   */
  async recordCashPayment({
    bookingId,
    customerId,
    amount,
    adminId,
  }: {
    bookingId: string;
    customerId: string;
    amount: number;
    adminId: string;
  }) {
    // Get booking details
    const [bookingRows] = await pool.query<BookingRow[]>(`
      SELECT b.*, h.id AS hotelId, h.name AS hotelName, h.vendorId AS vendorId
      FROM bookings b
      LEFT JOIN hotels h ON b.hotelId = h.id
      WHERE b.id = ?
    `, [bookingId]);
    
    if (!bookingRows || bookingRows.length === 0) {
      throw new Error('Booking not found');
    }
    
    const bookingData = bookingRows[0];

    // Get hotel payment settings
    const [settingsRows] = await pool.query<RowDataPacket[]>(`
      SELECT taxRate AS taxRate, commissionRate AS commissionRate
      FROM hotel_payment_settings
      WHERE hotelId = ?
    `, [bookingData.hotelId]);
    
    if (!settingsRows || settingsRows.length === 0) {
      throw new Error('Hotel payment settings not found');
    }
    
    const settings = settingsRows[0];

    // Get app settings
    const appSettings = await getAppSettings();

    // Calculate tax and commission
    const taxRate = settings.taxRate || appSettings?.defaultTaxRate || 5; // Default to 5%
    const commissionRate =
      settings.commissionRate || appSettings?.defaultCommissionRate || 10; // Default to 10%

    const taxAmount = (amount * taxRate) / 100;
    const adminCommission = (amount * commissionRate) / 100;
    const vendorAmount = amount - taxAmount - adminCommission;

    // Record payment and update booking in a transaction
    let connection: PoolConnection | null = null;
    try {
      connection = await beginTransaction();

      // Create payment record
      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO payments
        (booking_id, customer_id, amount, currency, payment_method, status, admin_commission, vendor_amount, tax_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId, 
        customerId, 
        amount, 
        'NGN', 
        PaymentMethod.CASH, 
        PaymentStatus.COMPLETED,
        adminCommission,
        vendorAmount,
        taxAmount
      ]);
      
      const paymentId = result.insertId;
      const payment = {
        id: paymentId,
        bookingId,
        customerId,
        amount,
        currency: 'NGN',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        adminCommission,
        vendorAmount,
        taxAmount
      };

      // Update booking payment status
      await connection.query(`
        UPDATE bookings
        SET paymentStatus = ?, status = ?
        WHERE id = ?
      `, [
        PaymentStatus.COMPLETED,
        bookingData.status === BookingStatus.PENDING ? BookingStatus.CONFIRMED : bookingData.status,
        bookingId
      ]);

      await commitTransaction(connection);

      return {
        success: true,
        payment,
        booking: {
          id: bookingData.id,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      };
    } catch (error) {
      if (connection) await rollbackTransaction(connection);
      throw error;
    }
  },
  
  /**
   * Record a bank transfer payment
   */
  async recordBankTransfer({
    bookingId,
    customerId,
    amount,
    adminId,
    bankReference,
  }: {
    bookingId: string;
    customerId: string;
    amount: number;
    adminId: string;
    bankReference: string;
  }) {
    // Get booking details
    const [bookingRows] = await pool.query<BookingRow[]>(`
      SELECT b.*, h.id AS hotelId, h.name AS hotelName, h.vendorId AS vendorId
      FROM bookings b
      LEFT JOIN hotels h ON b.hotelId = h.id
      WHERE b.id = ?
    `, [bookingId]);
    
    if (!bookingRows || bookingRows.length === 0) {
      throw new Error('Booking not found');
    }
    
    const bookingData = bookingRows[0];

    // Get hotel payment settings
    const [settingsRows] = await pool.query<RowDataPacket[]>(`
      SELECT taxRate AS taxRate, commissionRate AS commissionRate
      FROM hotel_payment_settings
      WHERE hotelId = ?
    `, [bookingData.hotelId]);
    
    if (!settingsRows || settingsRows.length === 0) {
      throw new Error('Hotel payment settings not found');
    }
    
    const settings = settingsRows[0];

    // Get app settings
    const appSettings = await getAppSettings();

    // Calculate tax and commission
    const taxRate = settings.taxRate || appSettings?.defaultTaxRate || 5; // Default to 5%
    const commissionRate =
      settings.commissionRate || appSettings?.defaultCommissionRate || 10; // Default to 10%

    const taxAmount = (amount * taxRate) / 100;
    const adminCommission = (amount * commissionRate) / 100;
    const vendorAmount = amount - taxAmount - adminCommission;

    // Record payment and update booking in a transaction
    let connection: PoolConnection | null = null;
    try {
      connection = await beginTransaction();

      // Create payment record
      const [result] = await connection.query<ResultSetHeader>(`
        INSERT INTO payments
        (booking_id, customer_id, amount, currency, payment_method, status, admin_commission, vendor_amount, tax_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId, 
        customerId, 
        amount, 
        'NGN', 
        PaymentMethod.BANK_TRANSFER, 
        PaymentStatus.COMPLETED,
        adminCommission,
        vendorAmount,
        taxAmount
      ]);
      
      const paymentId = result.insertId;
      const payment = {
        id: paymentId,
        bookingId,
        customerId,
        amount,
        currency: 'NGN',
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.COMPLETED,
        adminCommission,
        vendorAmount,
        taxAmount
      };

      // Update booking payment status
      await connection.query(`
        UPDATE bookings
        SET paymentStatus = ?, status = ?
        WHERE id = ?
      `, [
        PaymentStatus.COMPLETED,
        bookingData.status === BookingStatus.PENDING ? BookingStatus.CONFIRMED : bookingData.status,
        bookingId
      ]);

      await commitTransaction(connection);

      return {
        success: true,
        payment,
        booking: {
          id: bookingData.id,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      };
    } catch (error) {
      if (connection) await rollbackTransaction(connection);
      throw error;
    }
  },
};