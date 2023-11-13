const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");

const {
  adminLogin,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  register,
} = require("../controllers/userController");

router.post("/user/create", auth, isAdmin, register);
router.get("/user/all", auth, isAdmin, getAllUsers);
router
  .route("/user/:id")
  .get(auth, isAdmin, getUser)
  .put(auth, isAdmin, updateUser)
  .delete(auth, isAdmin, deleteUser);

module.exports = router;

// const {
//   getStatistics,
//   getAll,
//   postSingleImage,
//   postMultipleImages,
// } = require("../controllers/adminController");
// const {
//   createCategory,
//   deleteCategory,
//   updateCategory,
// } = require("../controllers/categoryController");
// const {
//   getAllOrders,
//   deleteOrder,
//   getOrderById,
//   updateOrderStatus,
// } = require("../controllers/orderController");
// const {
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   deleteSubProduct,
//   createSubProduct,
//   getAllProducts,
//   getProductAdmin,
// } = require("../controllers/productController");
// const {
//   createPromotion,
//   updatePromotion,
//   deletePromotion,
// } = require("../controllers/promotionController");
// const { allReviews, deleteReview } = require("../controllers/reviewController");
// const {
//   createSubCategory,
//   updateSubCategory,
//   deleteSubCategory,
// } = require("../controllers/subCategoryController");

// const {
//   updateQuantity,
//   deleteQuantity,
//   createQuantity,
// } = require("../controllers/quantityController");
// const {
//   createFaq,
//   updateFaq,
//   deleteFaq,
// } = require("../controllers/faqController");
// const {
//   createShipping,
//   updateShipping,
//   deleteShipping
// } = require("../controllers/shippingController");

// const { auth, isAdmin } = require("../middlewares/auth");
// const { s3Uploadv2, upload, s3UploadMulti } = require("../utils/s3");
// const { createSale, getAllSale, getSale, updateSale, deleteSale } = require("../controllers/saleController");

// router.get("/all", getAll);
// router.get("/statistics/:time", auth, isAdmin, getStatistics);
// router.post("/login", adminLogin);


// router.get("/orders/all", auth, isAdmin, getAllOrders);
// router.put("/order/:id/update/status", auth, isAdmin, updateOrderStatus);
// router
//   .route("/order/:id")
//   .get(auth, isAdmin, getOrderById)
//   .delete(auth, isAdmin, deleteOrder);

// router.post("/category/create", auth, isAdmin, createCategory);
// router
//   .route("/category/:id")
//   .put(auth, isAdmin, updateCategory)
//   .delete(auth, isAdmin, deleteCategory);

// router.post("/subCategory/create", auth, isAdmin, createSubCategory);
// router
//   .route("/subCategory/:id")
//   .put(auth, isAdmin, updateSubCategory)
//   .delete(auth, isAdmin, deleteSubCategory);

// router.post("/product/create", auth, isAdmin, createProduct);
// router.get("/product/all", auth, isAdmin, getAllProducts);
// router
//   .route("/product/:id")
//   .get(auth, isAdmin, getProductAdmin)
//   .put(auth, isAdmin, updateProduct)
//   .delete(auth, isAdmin, deleteProduct);

// router.post("/sub-product/create", auth, isAdmin, createSubProduct);
// router.delete("/sub-product/:id", auth, isAdmin, deleteSubProduct);

// router.get("/review/all", auth, isAdmin, allReviews);
// router.delete("/review/:id", auth, isAdmin, deleteReview);

// router.post("/promotion/create", auth, isAdmin, createPromotion);
// router
//   .route("/promotion/:id")
//   .put(auth, isAdmin, updatePromotion)
//   .delete(auth, isAdmin, deletePromotion);

// router.post("/quantity/create", auth, isAdmin, createQuantity);
// router
//   .route("/quantity/:id")
//   .put(auth, isAdmin, updateQuantity)
//   .delete(auth, isAdmin, deleteQuantity);

// router.post("/sale/create", auth, isAdmin, createSale);
// router.get("/sale/all", auth, isAdmin, getAllSale);
// router
//   .route("/sale/:id")
//   .get(auth, isAdmin, getSale)
//   .put(auth, isAdmin, updateSale)
//   .delete(auth, isAdmin, deleteSale);

// router.post("/faq/create", auth, isAdmin, createFaq);
// router
//   .route("/faq/:id")
//   .put(auth, isAdmin, updateFaq)
//   .delete(auth, isAdmin, deleteFaq);

// router.post("/shipping/create", auth, isAdmin, createShipping);
// router
//   .route("/shipping/:id")
//   .put(auth, isAdmin, updateShipping)
//   .delete(auth, isAdmin, deleteShipping);

// router.post("/image", upload.single("image"), postSingleImage);
// router.post("/multi-image", upload.array("image"), postMultipleImages);

