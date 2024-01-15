const mongoose = require(`mongoose`);

const ReviewSchema = mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide rating'],
    },
    title: {
        type: String,
        trim: true,
        required: [true, 'Please provide review text'],
        maxlength: 100,
    },
    comment: {
        type:String,
        required: [true, 'Please provide review comment'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
}, {timestamps: true});

//  now i want the each user sends only one review per product => thus i need indexing for the reviews -> thus same index for both user and products
ReviewSchema.index({ product: 1, user: 1 }, {unique: true});
//  per user, per product -> unique true for reviews.


//  static and not methods because i want to call the method on the schema and not on the instance
//  this can also be done in a hardcoded way in the mongoDb aggregate GUI
ReviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          numOfReviews: { $sum: 1 },
        },
      },
    ]);

    // console.log(result);
  
    try {
      await this.model('Product').findOneAndUpdate(
        { _id: productId },
        {
          averageRating: Math.ceil(result[0]?.averageRating || 0),
          numOfReviews: result[0]?.numOfReviews || 0,
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

//  works in the case of update review
//  works also for create review
ReviewSchema.post(`save`, async function() {
    await this.constructor.calculateAverageRating(this.product);
});

//  works in the case of delete review
ReviewSchema.post(`remove`, async function() {
    await this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);