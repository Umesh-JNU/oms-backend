class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search(key) {
        if (this.queryStr.keyword) {
            var keyword = {
                [key]: {
                    $regex: this.queryStr.keyword,
                    $options: "i",
                }
            }
        } else {
            var keyword = {}
        }

        console.log("keyword", keyword);
        this.query = this.query.find({ ...keyword });
        return this;
    }

    searchUser() {
        const searchTerm = this.queryStr.keyword;
        if (searchTerm) {
            var keyword = {
                $or: [
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { firstname: { $regex: searchTerm, $options: 'i' } },
                    { lastname: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        } else {
            var keyword = {}
        }

        console.log("keyword", keyword);
        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const queryCopy = { ...this.queryStr }

        // Removing field for category
        const removeFields = ["keyword", "currentPage", "resultPerPage"];
        removeFields.forEach(key => delete queryCopy[key]);

        // filter for price
        let querystr = JSON.stringify(queryCopy);
        querystr = querystr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

        this.query = this.query.find(JSON.parse(querystr));
        return this;
    }

    pagination() {
        console.log({ q: this.query.options.sort })
        const currentPage = Number(this.queryStr.currentPage);
        const resultPerPage = Number(this.queryStr.resultPerPage);

        const skip = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);
        return this;
    }
}

module.exports = APIFeatures