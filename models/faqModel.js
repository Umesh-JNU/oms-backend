const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required."]
    },
    answer: {
      type: String,
      required: [true, "Answer is required."],
    },
    type: {
      type: String,
      required: [true, 'Type for FAQ is required'],
      enum: ['top-most', 'shipping', 'payment', 'ordering']
    }
  },
  { timestamps: true }
);

const faqModel = mongoose.model('Faq', faqSchema);

const aggregate = async (queryOptions, match) => {
  console.log({ match });
  return await faqModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        faqs: { $push: "$$ROOT" }
      },
    },
    {
      $group: {
        _id: null,
        faqs: {
          $push: {
            k: "$_id",
            v: "$faqs"
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        faqs: { $arrayToObject: "$faqs" }
      }
    },
    ...queryOptions
  ]);

}
module.exports = { faqModel, aggregate };