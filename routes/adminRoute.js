const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");

// ------------------------------ USER ---------------------------------
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  register,
} = require("../controllers/userController");

router.post("/user/create", auth, isAdmin, register);
router.get("/user/all", auth, isAdmin, getAllUsers);
router.route("/user/:id")
  .get(auth, isAdmin, getUser)
  .put(auth, isAdmin, updateUser)
  .delete(auth, isAdmin, deleteUser);

// ---------------------------- CATEGORY ------------------------------
const {
  createCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");

router.post("/category/create", auth, isAdmin, createCategory);
router.route("/category/:id")
  .put(auth, isAdmin, updateCategory)
  .delete(auth, isAdmin, deleteCategory);

// ---------------------------- PRODUCTS ------------------------------
const {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteSubProduct,
  createSubProduct,
  getAllProducts,
  getProductAdmin,
} = require("../controllers/productController");

router.post("/product/create", auth, isAdmin, createProduct);
router.get("/product/all", auth, isAdmin, getAllProducts);
router.route("/product/:id")
  .get(auth, isAdmin, getProductAdmin)
  .put(auth, isAdmin, updateProduct)
  .delete(auth, isAdmin, deleteProduct);

router.post("/sub-product/create", auth, isAdmin, createSubProduct);
router.delete("/sub-product/:id", auth, isAdmin, deleteSubProduct);

// ----------------------------------- IMAGE -----------------------------------------
const { upload } = require("../utils/s3");
const {
//   getStatistics,
//   getAll,
  postSingleImage,
  postMultipleImages,
} = require("../controllers/adminController");

router.post("/image", upload.single("image"), postSingleImage);
router.post("/multi-image", upload.array("image"), postMultipleImages);

// ----------------------------------- FAQ -----------------------------------------
const {
  createFaq,
  updateFaq,
  deleteFaq,
} = require("../controllers/faqController");

router.post("/faq/create", auth, isAdmin, createFaq);
router
  .route("/faq/:id")
  .put(auth, isAdmin, updateFaq)
  .delete(auth, isAdmin, deleteFaq);
  
// ----------------------------------- ORDER -----------------------------------------
const {
  getAllOrders,
  deleteOrder,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

router.get("/orders/all", auth, isAdmin, getAllOrders);
router.put("/order/:id/update/status", auth, isAdmin, updateOrderStatus);
router
  .route("/order/:id")
  .get(auth, isAdmin, getOrderById)
  .delete(auth, isAdmin, deleteOrder);
module.exports = router;





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
//   createShipping,
//   updateShipping,
//   deleteShipping
// } = require("../controllers/shippingController");

// const { auth, isAdmin } = require("../middlewares/auth");
// const { createSale, getAllSale, getSale, updateSale, deleteSale } = require("../controllers/saleController");

// router.get("/all", getAll);
// router.get("/statistics/:time", auth, isAdmin, getStatistics);
// router.post("/login", adminLogin);

// router.post("/subCategory/create", auth, isAdmin, createSubCategory);
// router
//   .route("/subCategory/:id")
//   .put(auth, isAdmin, updateSubCategory)
//   .delete(auth, isAdmin, deleteSubCategory);

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

// router.post("/shipping/create", auth, isAdmin, createShipping);
// router
//   .route("/shipping/:id")
//   .put(auth, isAdmin, updateShipping)
//   .delete(auth, isAdmin, deleteShipping);



