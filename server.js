/*********************************************************************************
*  BTI325 – Assignment 6
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  
*  No part of this assignment has been copied manually or electronically from any other source
*  (including web sites) or distributed to other students.
* 
*  Name: Param katrodia    Student ID: 112126222   Date: Dec 4th, 2023
*
*  Online (Cyclic) URL: 
*
********************************************************************************/ 

const authData = require('./auth-service.js')
const clientSessions = require("client-sessions")
const stripJs = require('strip-js');
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const express = require('express');
const app = express();
const path = require('path');
const HTTP_PORT = process.env.PORT || 8080;
const blogService = require('./blog-service.js');
const exphbs = require('express-handlebars');

// Middleware for handling form data
app.use(express.urlencoded({ extended: true }));

app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options)
        {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options)
        {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue)
            {
                return options.inverse(this);
            } else
            {
                return options.fn(this);
            }
        },
        safeHTML: function (context)
        {
            return stripJs(context);
        },
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }
    }
}));
app.set('view engine', 'hbs');

function ensureLogin  (req, res, next) {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      next();
    }
}
cloudinary.config({
  cloud_name: 'dxetbauyx',
  api_key: '646543674724467',
  api_secret: 'niXD3n30lziZyvhFR0Yq7Q9DlV4',
  secure: true
});
const upload = multer(); 

app.use(express.static('public'));

app.use(
    clientSessions({
      cookieName: 'session', // this is the object name that will be added to 'req'
      secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
      duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
      activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
    })
  );

  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
  });

// function startListening() {
//     console.log("Express http server listening on: " + HTTP_PORT);
//   }

  // used to fix nav bar in "default" layout 
app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get('/', (req, res) => {
    res.redirect('/blog');
});


app.get('/about', (req, res) => {
    res.render('about');
});


app.get('/posts/add', ensureLogin, async (req, res) => {
    try {
        const categories = await blogService.getCategories();
        res.render('addPost', { categories: categories });
    } catch (error) {
        res.render('addPost', { categories: [] });
    }
});

app.post('/posts/add', upload.single("featureImage"), ensureLogin, (req, res) => {
  let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
              (error, result) => {
              if (result) {
                  resolve(result);
              } else {
                  reject(error);
              }
              }
          );
  
          streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
  };
  
  async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
  }
  
  upload(req).then(async (uploaded)=>{
      req.body.featureImage = uploaded.url;
  
      // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
      try {
          const newPost = await blogService.addPost(req.body);
          res.redirect('/posts');
        } 
        catch (error) {
          res.status(500).send('Error adding post: ' + error.message);
        }
  });

});

app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogService.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogService.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogService.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});


app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogService.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogService.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the post by "id"
      viewData.post = await blogService.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogService.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});


app.get('/posts', ensureLogin, (req, res) => {
  if (req.query.category) {
      blogService.getPostsByCategory(req.query.category)
          .then((result) => res.render('posts', { posts: result }))
          .catch((err) => res.send({ "message:": err }));
  } else if (req.query.minDate) {
      blogService.getPostsByMinDate(req.query.minDate)
          .then((result) => res.render('posts', { posts: result }))
          .catch((err) => res.send({ "message:": err }));
  } else {
      blogService.getAllPosts()
          .then((data) => res.render('posts', { posts: data }))
          .catch((err) => res.send({ message: "no results" }))
  }
});

app.get('/posts/:value', ensureLogin, (req, res) =>
{
    serv.getPostById(req.params.value)
        .then(result => res.send(result))
        .catch(err => res.send({ "message": err }))
});
  

app.get('/categories', (req, res) => {
  blogService.getCategories()
      .then((data) => res.render('categories', { categories: data }))
      .catch((err) => res.render("categories", { message: "no results" }));
});



// Route to get categories
app.get('/categories', ensureLogin, (req, res) => {
  blogService.getCategories().then(categories => {
      res.json(categories);
    }).catch(error => {
      res.status(404).json({ message: error });
    });
});

//-----------------------------------------------//

// Route to render the form for adding a category
app.get('/categories/add', (req, res) => {
    res.render('addCategory');
  });
  
  // Route to handle the addition of a new category
  app.post('/categories/add', async (req, res) => {
    try {
      const result = await blogService.addCategory(req.body);
      res.redirect('/categories');
    } catch (error) {
      res.status(500).send('Unable to create category');
    }
  });
  
  // Route to delete a category by ID
  app.get('/categories/delete/:id', async (req, res) => {
    try {
      const result = await blogService.deleteCategoryById(req.params.id);
      res.redirect('/categories');
    } catch (error) {
      res.status(500).send('Unable to Remove Category / Category not found');
    }
  });
  
  // Route to delete a post by ID
  app.get('/posts/delete/:id', async (req, res) => {
    try {
        const result = await blogService.deletePostById(req.params.id);
        res.redirect('/posts');
    } catch (error) {
        res.status(500).send('Unable to Remove Post / Post not found');
    }
});

app.get('/categories/add', ensureLogin, (req, res) =>
{
    res.render('addCategory', {body: 'addCategory'});
});

app.post('/categories/add', ensureLogin, (req, res) =>
{
    serv.addCategory(req.body).then(() => res.redirect('/categories'))
});

app.get('/categories/delete/:id', ensureLogin, (req, res) =>
{
    serv.deleteCategoryById(req.params.id).then(() => res.redirect('/categories')).catch(() => res.status(500).send('Unable to Remove Category / Category not found'))
});

app.get('/posts/delete/:id', ensureLogin, (req, res) =>
{
    serv.deletePostById(req.params.id).then(() => res.redirect('/posts')).catch(() => res.status(500).send('Unable to Remove Post / Post not found'))
});

app.get('/login', (req, res) =>
{
    res.render('login');
});

app.get('/register', (req, res) =>
{
    res.render('register');
});

app.post('/register', (req, res) =>
{
    authData.registerUser(req.body).then((data) =>
    {
        res.render('register', { successMessage: "User created" })
    }).catch(err =>
    {
        res.render('register', {errorMessage: err, userName: req.body.userName} )
    })
});

app.post('/login', (req, res) =>
{

    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/posts');
    }).catch(err =>
    {
        res.render('login', {errorMessage: err, userName: req.body.userName})
    })
    
});

app.get('/logout', (req, res) =>
{
    req.session.reset();
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) =>
{
    res.render('userHistory');
});
  //-------------------------------------------------------------//

// Custom Error Message
app.use((req, res) => {
  res.status(404).send("Your code ain't working bro...try again");
});


blogService.initialize().then(authData.initialize).then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});


