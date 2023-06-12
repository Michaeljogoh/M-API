const router = require("express").Router();
const Post = require("../models/Post");
const cloudinary = require('cloudinary');
const upload = require('../utils/multer');
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


//CREATE POST
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//CREATE POST to cloudinary
router.post("/uploads", upload.single("file"), async (req, res) => {
  try {
  // Upload image to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path);
  // Create new user
  let newUpload =  await Post.create({
    title: req.body.title,
    desc: req.body.desc,
    photo: result.secure_url,
  });
  console.log(newUpload)
 return res.status(200).json({newUpload});
    
  } catch (error) {
    console.log(error)
    
  }

});

//UPDATE POST
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.body.username) {
      try {
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $set: req.body,
          },
          { new: true }
        );
        res.status(200).json(updatedPost);
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE POST
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.body.username) {
      try {
        await post.delete();
        res.status(200).json("Post has been deleted...");
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL POSTS
router.get("/", async (req, res) => {
  const username = req.query.user;
  const catName = req.query.cat;
  const {page = 1, limit = 4} = req.query;
  try {
    let posts;
    if (username) {
      posts = await Post.find({ username });
    } else if (catName) {
      posts = await Post.find({
        categories: {
          $in: [catName],
        },
      });
    } else {
     let getPosts = await Post.find()
      .limit(limit * 1)
      .skip((page - 1 ) * limit)
      .exec();
      const count = await Post.countDocuments();
      res.status(200).json({getPosts, totalPages:Math.ceil(count / limit), currentPage: page})
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/search/:word', async (req , res)=>{
  const {page = 1, limit = 5} = req.query;
  const searchPosts = await Post.find({'$options':[{title:{$regex:req.params.word}}]})
  .limit(limit * 1)
  .skip((page - 1 ) * limit)
  .exec();
  //Get Total documents in blogPost collection
const search = await Post.countDocuments();
  res.status(200).json({searchPosts,  totalPages:Math.ceil(search/ limit), currentPage: page});
});

module.exports = router;
