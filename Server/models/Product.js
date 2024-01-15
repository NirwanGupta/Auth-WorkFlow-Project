const mongoose = require(`mongoose`);

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'please provide name'],
            trim: true,
            maxlength: [100, 'name should not exceed 100 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Please provide product price'],
        },
        description: {
            type: String,
            required: [true, 'Please provide product description'],
            maxlength: [1000, 'description can not be more than 1000 characters'],
        },
        image: {
            type: String,
            default: `/uploads/example.png`,
        },
        category: {
            type: String,
            required: [true, 'Please provide product category'],
            enum: [`office`,`kitchen`,`bedroom`],
        },
        company: {
            type: String,
            required: [true, 'Please provide company'],
            enum: {
                values: ['ikea', 'liddy', 'marcos'],
                message: '{VALUE} is not supported',
            },
        },
        colors: {
            type:[String],
            default: [`#222`],
            required: true,
        },
        featured: {
            type: Boolean,
            default: false,
        },
        freeShipping: {
            type: Boolean,
            default: false,
        },
        inventory: {
            type: Number,
            required: true,
            default: 15,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        numOfReviews: {
            type: Number,
            default: 0,
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: `User`,
            required: true,
        },
    },
    { timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true} },
);

ProductSchema.virtual(`reviews`, {
    ref: `Review`,
    localField: `_id`,  //  the only connection between review and products is the product that is set in the review model, and the product id in the product itself is localFeild
    foreignField: `product`,    //  because the connection exists on the product field of the reviews model
    justOne: false,
});


//  deletes all the reviews that are associated with a product that was removed by the admin
ProductSchema.pre(`remove`, async function(/*next*/) {
    //  this.model(`ModelName`) -> this is used to go to other model -> Review here
    await this.model(`Review`).deleteMany({product: this._id});
    //  product-> because product is the field present in the Review model that is the only connnection netween review and product
})

module.exports = mongoose.model('Product', ProductSchema)