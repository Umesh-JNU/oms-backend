const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Please provide the category's name."],
      maxLength: [40, "Category Name cannot exceed 30 characters"],
      minLength: [4, "Category Name should have at least 4 characters"],
    },
    desc: {
      type: String,
      required: [true, "Please describe the category."],
      maxLength: [250, "Category Description should have maximum 250 characters."]
    },
    category_img: {
      type: String,
    },
    location: {
      type: String,
      default: 'US',
      enum: ['US', 'CA']
    }
  },
  { timestamps: true }
);
const categoryModel = mongoose.model("Category", categorySchema);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxLength: [100, "Product Name cannot exceed 30 characters"],
      minLength: [4, "Product Name should have at least 4 characters"],
      required: [true, "Please provide the product's name."],
    },
    description: {
      type: String,
      maxLength: [250, "Product Description should have maximum 250 characters."]      // required: [true, "Please describe the product."],
    },
    // product_images: [{ type: String }],
    product_img: {
      type: String
    },
    // rating: { type: Number, default: 0 },
    // sale: { type: Number, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please provide belonging category."],
    }
  },
  { timestamps: true }
);
const productModel = mongoose.model("Product", productSchema);

const subProductSchema = new mongoose.Schema(
  {
    pid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Please provide Product reference id"],
    },
    // amount: {
    //   type: Number,
    //   required: [true, "Please enter the amount of product."],
    // },
    quantity: {
      type: Number,
      required: [true, "Please provide quantity."]
    },
    // quantity: {
    //   us: {
    //     type: Number,
    //     required: [true, "Please provide a quantity as per US"]
    //   },
    //   canada: {
    //     type: Number,
    //     required: [true, "Please provide a quantity as per Canada"]
    //   }
    // },
    stock: { type: Boolean, default: false },
    // volume: { type: Number, default: 0 }
  },
  { timestamps: true }
);
const subProdModel = mongoose.model("SubProduct", subProductSchema);

// const aggregate = async (match) => {
//   console.log({ match });
const aggregate = async (queryOptions, match, catLocationQuery) => {
  console.log({ queryOptions, match, catLocationQuery });
  const catQry = [{ $unwind: "$category" }];
  if (catLocationQuery) {
    catQry.unshift(catLocationQuery);
  }
  console.log({ catQry });
  return await subProdModel.aggregate([
    {
      $group: {
        _id: "$pid",
        subProducts: { $push: "$$ROOT" }
      },
    },
    {
      $lookup: {
        from: "products",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$productId"] }, // used to remove redundant populate
              ...match,
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category"
            }
          },
          ...catQry,

          // {
          //   $lookup: {
          //     from: "subcategories",
          //     localField: "sub_category",
          //     foreignField: "_id",
          //     as: "sub_category"
          //   }
          // },
          // { $unwind: "$sub_category" }
        ],
        as: "pid"
      }
    },
    { $unwind: "$pid" },
    { $sort: { "pid.createdAt": -1 } },
    // {
    //   $addFields: {
    //     subProducts: {
    //       $map: {
    //         input: "$subProducts",
    //         as: "subProduct",
    //         in: {
    //           $mergeObjects: [
    //             "$$subProduct", {
    //               updatedAmount: {
    //                 $subtract: ["$$subProduct.amount", { $multiply: [0.01, "$$subProduct.amount", "$pid.sale"] }]
    //               }
    //             }
    //           ]
    //         }
    //       }
    //     }
    //   }
    // },
    // { $project: { "subProducts.pid": 0 } },
    // { $addFields: { "_id.subProducts": "$subProducts" } },
    // { $project: { subProducts: 0 } },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$pid", { subProducts: "$subProducts" }]
        }
      }
    },
    { $project: { "subProducts.pid": 0 } },

    ...queryOptions
  ]);

}

module.exports = {
  aggregate,
  categoryModel,
  productModel,
  subProdModel,
};
