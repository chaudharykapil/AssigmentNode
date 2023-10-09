var express = require('express');
var router = express.Router();
const axios = require("axios")
const lodash = require('lodash');
// function to load data from third party api
async function loadBlogdata(){
  r = await axios.get("https://intent-kit-16.hasura.app/api/rest/blogs",{headers:{
      'x-hasura-admin-secret':'32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
  }})
  if(r.status == 200 && r.data){
    return r.data.blogs
  }
  return []
}

function AnalyseBlogs(bloglist){
  let res = {}

  //get length of blog list
  const totalBlogs = bloglist.length;
  res.totalblogs = totalBlogs;

  //get blog of longest title
  const longestTitleBlog = lodash.maxBy(bloglist, blog => blog.title.length);
  res.longest_title = longestTitleBlog.title

  // get no of blogs related to term 'privacy'
  const privacyBlogs = query_blog_memo(bloglist,"privacy");
  const numPrivacyBlogs = privacyBlogs.length;
  res.privacy_blogs_no = numPrivacyBlogs;

  // get uniques titles of blogs
  const uniqueBlogTitles = lodash.uniqBy(bloglist, 'title');
  res.unique_titles = uniqueBlogTitles.map(blog => blog.title);

  return res;
}

// create memoize function for analysis
const analysis_memo = lodash.memoize(AnalyseBlogs,()=>{
  let date  = new Date()
  return (date.getMinutes()/5).toString()
})
// create memoize function for blog data
const loadData_memo = lodash.memoize(loadBlogdata,()=>{
  let date  = new Date()
  return (date.getMinutes()/5).toString()
})
// create memoize function for query
const query_blog_memo = lodash.memoize((r,q)=>{
  return lodash.filter(r, blog => lodash.includes(blog.title.toLowerCase(), q));
},(r,q)=>{
  return q
})

/* Route for analysis of blogs. */
router.get('/api/blog-stats',async function(req, res, next) {
  let blogdata = []
  try{
    r = await loadData_memo()
    let analysis = analysis_memo(r)
    console.log(analysis)
    return res.send(analysis);
  }
  catch(e){
    return res.sendStatus(404).send("API not Working")
  }
});
/* Route to perform search operation */ 
router.get("/api/blog-search",async (req,res)=>{
  r = await loadData_memo();
  params = req.query
  if(!params["query"]){
    return res.send("Please provide query")
  }
  const privacyBlogs = query_blog_memo(r,params['query'].toLowerCase())
  return res.send(privacyBlogs)
})


module.exports = router;
