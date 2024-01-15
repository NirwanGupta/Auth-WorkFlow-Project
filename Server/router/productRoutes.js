const express = require(`express`);
const router = express.Router();
const {authenticateUser, authorisePermission} = require(`../middleware/authentication`);

const { singleProductReview } = require(`../controllers/reviewController`);

const {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage,

} = require(`../controllers/productController`);

router
    .route(`/`)
    .post([authenticateUser, authorisePermission(`admin`)], createProduct)
    .get(getAllProducts);

router
    .route(`/uploadImage`)
    .post([authenticateUser, authorisePermission(`admin`)], uploadImage);

router
    .route(`/:id`)
    .get(getSingleProduct)
    .patch([authenticateUser, authorisePermission(`admin`)], updateProduct)
    .delete([authenticateUser, authorisePermission('admin')], deleteProduct);

router.route(`/:id/reviews`).get(singleProductReview);

module.exports = router;