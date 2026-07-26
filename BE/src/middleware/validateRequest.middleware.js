import ApiError from "../utils/apiError.utils.js";

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Zod schema se request ko strict validate karna
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Agar validation pass ho gaya, toh request ko controller ke paas bhej do
      next();
    } catch (error) {
      // Agar error hai (matlab user ne galat data bheja hai)
      // Zod ki array of errors ko ek clean, readable string me convert karna
      const errorMessage = error.errors
        .map((err) => `${err.path[err.path.length - 1]}: ${err.message}`)
        .join(', ');

      // Custom ApiError throw karna jo seedha hamare errorHandler.js ke paas jayega
      next(new ApiError(400, errorMessage));
    }
  };
};

export default validateRequest;