
const fs = require('fs');
const Sequelize = require('sequelize')

var sequelize = new Sequelize("SenecaDB", "Param3108", "v4DUVTHuERj1", {
    host: "ep-damp-cake-67789457.us-east-2.aws.neon.tech",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const Post = sequelize.define("Post", {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
  }
);

const Category = sequelize.define("Category", {
    category: Sequelize.STRING,
  }
);

Post.belongsTo(Category, { foreignKey: "category" });


module.exports.initialize = async () => {
    try {
        await sequelize.sync();
        return Promise.resolve();
    } catch (error) {
        return Promise.reject("Unable to sync the database");
    }
}

module.exports.getAllPosts = () => {
    return Post.findAll()
        .then((posts) => {
            if (posts.length > 0) {
                return Promise.resolve(posts);
            } else {
                return Promise.reject("No posts returned");
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching posts");
        });
}

module.exports.getPostsByCategory = (category) => {
    return Post.findAll({ where: { category: category } })
        .then((posts) => {
            if (posts.length > 0) {
                return Promise.resolve(posts);
            } else {
                return Promise.reject("No posts in that category");
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching posts by category");
        });
}

module.exports.getPostsByMinDate = (minDateStr) => {
    return Post.findAll({
        where: { postDate: { [Sequelize.Op.gte]: new Date(minDateStr) } }
    })
        .then((posts) => {
            if (posts.length > 0) {
                return Promise.resolve(posts);
            } else {
                return Promise.reject(`No posts past ${minDateStr}`);
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching posts by date");
        });
}

module.exports.getPostById = (id) => {
    return Post.findByPk(id)
        .then((post) => {
            if (post) {
                return Promise.resolve(post);
            } else {
                return Promise.reject(`No post found with id: ${id}`);
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching post by ID");
        });
}

module.exports.addPost = (postData) => {
    postData.published = !!postData.published;

    // Loop through properties to replace empty strings with null
    for (const key in postData) {
        if (postData[key] === "") {
            postData[key] = null;
        }
    }

    postData.postDate = new Date();

    return Post.create(postData)
        .then((createdPost) => {
            return Promise.resolve(createdPost);
        })
        .catch((error) => {
            return Promise.reject("Unable to create post");
        });
}

module.exports.getPublishedPosts = () => {
    return Post.findAll({ where: { published: true } })
        .then((posts) => {
            if (posts.length > 0) {
                return Promise.resolve(posts);
            } else {
                return Promise.reject("No published posts returned");
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching published posts");
        });
}

module.exports.getPublishedPostsByCategory = (category) => {
    return Post.findAll({ where: { published: true, category: category } })
        .then((posts) => {
            if (posts.length > 0) {
                return Promise.resolve(posts);
            } else {
                return Promise.reject("No published posts in that category returned");
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching published posts by category");
        });
}

module.exports.getCategories = () => {
    return Category.findAll()
        .then((categories) => {
            if (categories.length > 0) {
                return Promise.resolve(categories);
            } else {
                return Promise.reject("No categories returned");
            }
        })
        .catch((error) => {
            return Promise.reject("Error fetching categories");
        });
}

module.exports.addCategory = async function (categoryData) {
    // Replace empty strings with null in categoryData
    for (let key in categoryData) {
      if (categoryData.hasOwnProperty(key) && categoryData[key] === '') {
        categoryData[key] = null;
      }
    }
  
    try {
      const createdCategory = await Category.create(categoryData);
      return Promise.resolve(createdCategory);
    } catch (error) {
      return Promise.reject('Unable to create category');
    }
};
  
module.exports.deleteCategoryById = async function (id) {
    try {
      const deletedCategory = await Category.destroy({ where: { id } });
      if (deletedCategory === 1) {
        return Promise.resolve('Category deleted successfully');
      } else {
        return Promise.reject('Category not found or unable to delete');
      }
    } catch (error) {
      return Promise.reject('Error deleting category');
    }
};
  
module.exports.deletePostById = async function (id) {
    try {
        const deletedPost = await Post.destroy({ where: { id } });
        if (deletedPost === 1) {
            return Promise.resolve('Post deleted successfully');
        } else {
            return Promise.reject('Post not found or unable to delete');
        }
    } catch (error) {
        return Promise.reject('Error deleting post');
    }
};
