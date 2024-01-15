const Review = require(`../models/review`);
const Product = require(`../models/Product`);

const customError = require(`../errors`);
const {StatusCodes} = require(`http-status-codes`);
const {checkPermissions} = require(`../utils`);
const { custom } = require("joi");

const createReview = async(req, res) => {
    const { product: productId } = req.body;
    req.body.user = req.user.userId;

    //  check if product was valid or not
    const isValidProduct = await Product.findOne({_id: productId});

    if(!isValidProduct) {
        throw new customError.NotFoundError(`No product with id: ${productId}`);
    }

    //  check if the user has already submitted one review or not
    const alreadySubmitted = await Review.findOne({
        product: productId,
        user: req.user.userId,
    });

    if(alreadySubmitted) {
        throw new customError.BadRequestError(`Already submitted one review for this product`);
    }

    const review = await Review.create(req.body);

    res.status(StatusCodes.CREATED).json({review});
};

const getAllReview = async(req, res) => {
    const reviews = await Review.find({})
    .populate({    //  populate method is used mainly to get some data from other model
        path: 'product',    //  in the review model there is a property named product that has reference to the Product
        select: 'name conmpany price',  //  i want to see name company and price of the product of the product that is to be reviewed
    })
    // .populate({
    //     path: 'user',
    //     select: 'name ',
    // });
    res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

const getSingleReview = async(req, res) => {
    const {id: reviewId} = req.params;

    const review = await Review.findOne({_id: reviewId})
    .populate({    //  populate method is used mainly to get some data from other model
        path: 'product',    //  in the review model there is a property named product that has reference to the Product
        select: 'name conmpany price',  //  i want to see name company and price of the product of the product that is to be reviewed
    })
    // .populate({
    //     path: 'user',
    //     select: 'name ',
    // });

    if(!review) {
        throw new customError.NotFoundError(`No review with id: ${reviewId}`);
    }

    res.status(StatusCodes.OK).json({review});
};

const updateReview = async(req, res) => {
    const {id: reviewId} = req.params;
    const {rating, title, comment} = req.body;

    const review = await Review.findOne({_id: reviewId});

    if(!review) {
        throw new customError.NotFoundError(`No review with id: ${reviewId}`);
    }

    checkPermissions(req.user, review.user);

    review.rating = rating;
    review.title = title;
    review.comment = comment;

    await review.save();
    res.status(StatusCodes.OK).json({review});
};

const deleteReview = async(req, res) => {
    const {id: reviewId} = req.params;

    const review = await Review.findOne({_id: reviewId});
    if(!review) {
        throw new customError.NotFoundError(`No review with id: ${reviewId}`);
    }

    checkPermissions(req.user, review.user);    //  that you cannot delete the review of any other user

    await review.remove();
    res.status(StatusCodes.OK).json({msg: `Review deleted successfully`});
};

//  alternative to the virtuals => this can be used for setting queries, however virtual can not be used
const singleProductReview = async (req, res) => {
    const {id: productId} = req.params;
    const reviews = await Review.find({product: productId});
    res.status(StatusCodes.OK).json({reviews, count: reviews.length});
}

module.exports = {
    createReview,
    getAllReview,
    getSingleReview,
    updateReview,
    deleteReview,
    singleProductReview,
};