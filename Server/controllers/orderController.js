const Order = require(`../models/Order`);
const Product = require(`../models/Product`);

const customError = require(`../errors`);
const {StatusCodes} = require(`http-status-codes`);
const {checkPermissions} = require(`../utils`);

const fakeStripeAPI = async ({amount, currency}) => {
    const client_secret = 'someRndomValue';
    return {client_secret, amount};
}

const createOrder = async (req, res) => {
    const {items: cartItems, tax, shippingFee} = req.body;
    if(!cartItems || cartItems.length < 1) {
        throw new customError.BadRequestError(`No cart items provied`);
    }
    if(!tax || !shippingFee) {
        throw new customError.BadRequestError(`Please provide tax and shippoing Fee`);
    }

    let orderItems = [];
    let subTotal = 0;

    for(const item of cartItems) {
        const dbProduct = await Product.findOne({_id: item.product});
        if(!dbProduct) {
            throw new customError.NotFoundError(`No product with id: ${item.product}`);
        }
        const {name, price, image, _id} = dbProduct;
        const singleOrderItem = {
            amount: item.amount,
            name,
            price,
            image,
            product: _id,
        };
        //  add itam to order
        orderItems = [...orderItems, singleOrderItem];
        //  calculate the subtotal
        subTotal += item.amount * price;
    }
    //  calculate the total
    const total = tax + shippingFee + subTotal;

    //  get client secret
    const paymentIntent = await fakeStripeAPI({
        amount: total,
        currency: 'usd',
    });

    //  create the order
    const order = await Order.create({
        orderItems,
        total,
        subTotal,
        tax,
        shippingFee,
        clientSecret: paymentIntent.client_secret,
        user: req.user.userId,
    })
    res.status(StatusCodes.CREATED).json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
    const orders = await Order.find({});
    res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
    const { id: orderId } = req.params;
    const order = await Order.findOne({
        _id: orderId,
    });

    if(!order) {
        throw new customError.NotFoundError(`No order found with id: ${orderId}`);
    }

    checkPermissions(req.user, order.user); //  user can only access his own orders

    res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (req, res) => {
    const orders = await Order.find({
        user: req.user.userId,
    });
    res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
    const {id: orderId} = req.params;
    const {paymentIntentId} = req.body;

    const order = await Order.findOne({
        _id: orderId,
    });

    if(!order) {
        throw new customError.NotFoundError(`No order found with id: ${orderId}`);
    }

    if(!paymentIntentId) {
        throw new customError.BadRequestError(`Payment is still pending`);
    }
    checkPermissions(req.user, order.user);

    order.paymentIntentId = paymentIntentId;
    order.status = 'paid';

    await order.save();

    res.status(StatusCodes.OK).json({order});
};

module.exports = {
    getAllOrders,
    getSingleOrder,
    getCurrentUserOrders,
    createOrder,
    updateOrder,
};