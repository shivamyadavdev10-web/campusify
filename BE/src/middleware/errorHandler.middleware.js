import ApiError from "../utils/apiError.utils.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode ? error.statusCode : 500;
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    if (err.name === 'CastError') {
        error = new ApiError(400, `Resource not found. Invalid ID format.`);
    }
    
    if (err.code === 11000) {
        error = new ApiError(400, `Duplicate ${Object.keys(err.keyValue)} entered.`);
    }

    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, "Invalid token. Please log in again.");
    }
    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, "Token expired. Please log in again.");
    }

    return res.status(error.statusCode).json({
        status: false,
        message: error.message,
        errors: error.errors,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    });
};

export default errorHandler;