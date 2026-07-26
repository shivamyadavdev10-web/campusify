// import Razorpay from "razorpay";
// import crypto from "crypto";
// import Transaction from "../models/transaction.models.js";
// import User from "../models/user.models.js";
// import Semester from "../models/semester.models.js"; // ⚡ Yahan se 'src/' hata diya
// import catchAsync from "../utils/catchAsync.utils.js";
// import ApiError from "../utils/apiError.utils.js";
// // Razorpay Instance Setup
// // baad me init karenge jab payment ready ho jayega
// // const razorpay = new Razorpay({
// //   key_id: process.env.RAZORPAY_KEY_ID,
// //   key_secret: process.env.RAZORPAY_KEY_SECRET,
// // });

// // ==========================================
// // 1. CREATE ORDER (Website call karegi payment start karne se pehle)
// // ==========================================
// export const createOrder = catchAsync(async (req, res) => {
//   const { semesterId } = req.body;
//   const userId = req.user.id;

//   // 1. Semester ka price nikalo
//   const semester = await Semester.findById(semesterId);
//   if (!semester) {
//     throw new ApiError(404, "Semester not found");
//   }

//   // 2. Razorpay Order Options (Amount paise me hota hai, isliye * 100)
//   const options = {
//     amount: semester.price * 100,
//     currency: "INR",
//     receipt: `receipt_${Date.now()}`,
//   };

//   // 3. Razorpay se order create karwao
//   const order = await razorpay.orders.create(options);

//   // 4. Apne Database me "created" status ke sath save kar lo
//   await Transaction.create({
//     userId,
//     semesterId,
//     razorpayOrderId: order.id,
//     amount: semester.price,
//     status: "created",
//   });

//   res.status(200).json({
//     status: true,
//     message: "Order created successfully",
//     orderId: order.id,
//     amount: order.amount,
//   });
// });

// // ==========================================
// // 2. VERIFY PAYMENT & UNLOCK COURSE (Website success ke baad call karegi)
// // ==========================================
// export const verifyPayment = catchAsync(async (req, res) => {
//   const { razorpayOrderId, razorpayPaymentId, razorpaySignature, semesterId } = req.body;
//   const userId = req.user.id;

//   if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
//     throw new ApiError(400, "Payment details are incomplete");
//   }

//   // 1. Razorpay Signature ko Verify karna (Taaki hacker fake success na bhej de)
//   const body = razorpayOrderId + "|" + razorpayPaymentId;
//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(body.toString())
//     .digest("hex");

//   const isAuthentic = expectedSignature === razorpaySignature;

//   if (!isAuthentic) {
//     // Agar fake hai toh transaction fail mark karo
//     await Transaction.findOneAndUpdate(
//       { razorpayOrderId },
//       { status: "failed" }
//     );
//     throw new ApiError(400, "Payment verification failed. Invalid signature.");
//   }

//   // 2. Agar payment asli hai toh Transaction update karo
//   await Transaction.findOneAndUpdate(
//     { razorpayOrderId },
//     { razorpayPaymentId, status: "success" }
//   );

//   // 3. ⚡ THE MAGIC: Student ke account me Semester unlock karna
//   // $addToSet ensure karta hai ki ID sirf ek hi baar add ho (No duplicates)
//   console.log("working..payment.controller.js");
//   await User.findByIdAndUpdate(
//     userId,
//     { $addToSet: { purchasedSemesters: semesterId } },
//     { new: true }
//   );

//   res.status(200).json({
//     status: true,
//     message: "Payment successful and course unlocked!",
//   });
// });







import Razorpay from "razorpay";
import crypto from "crypto";
import Transaction from "../models/transaction.models.js";
import User from "../models/user.models.js";
import Semester from "../models/semester.models.js"; 
import catchAsync from "../utils/catchAsync.utils.js";
import ApiError from "../utils/apiError.utils.js";

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
    message: "Order created successfully",
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

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    await Transaction.findOneAndUpdate({ razorpayOrderId }, { status: "failed" });
    throw new ApiError(400, "Payment verification failed. Invalid signature.");
  }

  // ⚡ ATOMIC DB OPERATIONS: Dono tasks ko optimized aggregate matching me run kiya hai
  await Promise.all([
    Transaction.findOneAndUpdate({ razorpayOrderId }, { razorpayPaymentId, status: "success" }),
    User.findByIdAndUpdate(userId, { $addToSet: { purchasedSemesters: semesterId } })
  ]);

  res.status(200).json({
    status: true,
    message: "Payment successful and course unlocked!",
  });
});