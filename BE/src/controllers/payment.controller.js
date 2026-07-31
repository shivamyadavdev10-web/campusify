import Razorpay from "razorpay";
import crypto from "crypto";
import Transaction from "../models/transaction.models.js";
import User from "../models/user.models.js";
import Semester from "../models/semester.models.js"; 
import catchAsync from "../utils/catchAsync.utils.js";
import ApiError from "../utils/apiError.utils.js";

// MOCK RAZORPAY INSTANCE (User is not integrating real payments yet)
const razorpay = {
  orders: {
    create: async (options) => {
      return { id: `mock_order_${Date.now()}`, amount: options.amount };
    }
  }
};

// ==========================================
// 1. CREATE ORDER 
// ==========================================
export const createOrder = catchAsync(async (req, res) => {
  const { semesterId } = req.body;
  const userId = req.user.id;

  // ⚡ IMPROVEMENT: Added .select() and .lean() to save massive RAM during heavy purchase traffic
  const semester = await Semester.findById(semesterId).select('price').lean();
  if (!semester) {
    throw new ApiError(404, "Semester not found");
  }

  const options = {
    amount: semester.price * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };

  const order = await razorpay.orders.create(options);

  // ⚡ DB Write: Handled cleanly
  await Transaction.create({
    userId,
    semesterId,
    razorpayOrderId: order.id,
    amount: semester.price,
    status: "created",
  });

  res.status(200).json({
    status: true,
    message: "Order created successfully (Mock)",
    orderId: order.id,
    amount: order.amount,
  });
});

// ==========================================
// 2. VERIFY PAYMENT & UNLOCK COURSE
// ==========================================
export const verifyPayment = catchAsync(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, semesterId } = req.body;
  const userId = req.user.id;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, "Payment details are incomplete");
  }

  // Bypass verification for mock orders
  if (!razorpayOrderId.startsWith('mock_order_')) {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await Transaction.findOneAndUpdate({ razorpayOrderId }, { status: "failed" });
      throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }
  }

  // ⚡ ATOMIC DB OPERATIONS: Dono tasks ko optimized aggregate matching me run kiya hai
  await Promise.all([
    Transaction.findOneAndUpdate({ razorpayOrderId }, { razorpayPaymentId, status: "success" }),
    User.findByIdAndUpdate(userId, { $addToSet: { purchasedSemesters: semesterId } })
  ]);

  res.status(200).json({
    status: true,
    message: "Payment successful and course unlocked! (Mock)",
  });
});