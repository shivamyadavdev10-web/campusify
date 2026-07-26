const catchAsync = (requestHandler) => {
    return (req, res, next) => {
        // Promise resolve karega, aur koi bhi error aayi toh usko next() me pass kar dega
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export default catchAsync;