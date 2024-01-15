const Product = require(`../models/Product`);
const customError = require(`../errors`);
const {StatusCodes} = require(`http-status-codes`);
const { custom } = require("joi");
const path = require(`path`);

const createProduct = async (req, res) => {
    req.body.user = req.user.userId;    //  that this create id is created by some admin whose id will be present in req.user.userId
    const product = await Product.create(req.body);
    res.status(StatusCodes.CREATED).json({ product });
};

const getAllProducts = async (req, res) => {
    //  i want to get all the reviews that are related to my product, but we cannot use .populate directly method because in our productModel we have no property named review that has a reference to the Review model
    //  thus for this we have one way called mongoose virtuals

    //  first we have to set that our product model accept virtuals
    //  add {timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true}}
    //  then create the virtual property in the product model
    const products = await Product.find({}).populate(`reviews`);
    res.status(StatusCodes.OK).json({ products, count: products.length });
};

const getSingleProduct = async (req, res) => {
    const { id: productId } = req.params;

    const product = await Product.findOne({ _id: productId });

    if(!product) {
        throw new customError.NotFoundError(`No product with id: ${productId}`);
    }

    res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
    const { id: productId } = req.params;

    const product = await Product.findOneAndUpdate({_id: productId}, req.body, {
        new: true,
        runValidators: true,
    });

    if(!product) {
        throw new customError.NotFoundError(`No product with id: ${productId}`);
    }

    res.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (req, res) => {
    const { id: productId } = req.params;

    const product = await Product.findOne({ _id: productId });

    if(!product) {
        throw new customError.NotFoundError(`No product with id: ${productId}`);
    }

    //  used findOne and then .remove because remove invokes a pre method in the products model that deletes all the reviews that are assiciated with the product that is about to be deleted
    await product.remove();

    res.status(StatusCodes.OK).json({ msg: 'Success, Product removed' });
};

const uploadImage = async (req, res) => {
    if(!req.files) {
        throw new customError.BadRequestError(`Please Upload Image`);
    }

    const productImage = req.files.image;

    if(!productImage.mimetype.startsWith('image')) {
        throw new customError.BadRequestError(`Please Upload an Image`);
    }

    const maxSize = 1024*1024;

    if(productImage.size > maxSize) {
        throw new customError.BadRequestError(`Please upload an image with size less than 1MB`);
    }

    const imagePath = path.join(__dirname, `../public/uploads/`+`${productImage.name}`);
    await productImage.mv(imagePath);

    res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
};

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
};