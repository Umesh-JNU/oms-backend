const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");

// ------------------------------ USER ---------------------------------
const {
  getAllUsers,
  getChatUser,
  getUser,
  updateUser,
  deleteUser,
  register,
  updateAdminProfile,
  adminLogin
} = require("../controllers/userController");

router.post("/login", adminLogin);
router.put("/update-profile", auth, isAdmin, updateAdminProfile);
router.post("/user/create", auth, isAdmin, register);
router.get("/user/all", auth, isAdmin, getAllUsers);
router.get("/user/chat", auth, isAdmin, getChatUser);
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

// ----------------------------------- CHATS -----------------------------------------
const {
  createChat,
  getAccessToken,
  updateReadHorizon
} = require("../controllers/chatController");

router.get("/chat/access-token", auth, isAdmin, getAccessToken);
router.post("/chat/create", auth, isAdmin, createChat);
router.put("/chat/read-horizon", auth, isAdmin, updateReadHorizon);

// ----------------------------------- BANNER -----------------------------------------
const {
  createBanner,
  deleteBanner,
} = require("../controllers/bannerController");

router.post("/banner/create", auth, isAdmin, createBanner);
router.delete("/banner/:id", auth, isAdmin, deleteBanner);

module.exports = router;
