const express = require('express');
const bodyParser=require('body-parser');
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine','ejs');

let day=date.getDay();
//mongoose

const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://ipurpleshootingstar_db_user:deployAtlas@cluster0.fs73mex.mongodb.net/todoListDB?retryWrites=true&w=majority&appName=Cluster0");

const itemSchema = new mongoose.Schema({
    name:String
})

const listSchema = new mongoose.Schema({
    name:String,
    items:[itemSchema]
})

const Item = mongoose.model("item",itemSchema);
const List = mongoose.model("list",listSchema);

const task = new Item({
    name:"Welcome to your todo list"
})

const task1 = new Item({
    name:"Hit the + to add a new task"
})

const task2 = new Item({
    name:"<--- Hit this to delete the task"
})

const defaultItems = [task,task1,task2];

async function insertTask(){
    try{
        const result = await Item.insertMany(defaultItems,{rawResult:true});
        console.log("Inserted",result);
    }catch(err){
        console.log(err);
    }
}
// insertTask();

app.post("/",(req,res)=>{
    let newTask = req.body.task;
    const pageDetail = req.body.list;
    console.log(pageDetail);

    const item = new Item({
        name:newTask
    })
    if(pageDetail==day){
        item.save();
        res.redirect("/");
    }else{
        async function findList(){
            try{
                const result = await List.findOne({name:pageDetail});
                if(result){
                    result.items.push(item);
                    await result.save();
                    res.redirect("/"+pageDetail);
                }
            }catch(err){
                console.log(err);
            }
        }
        findList();
    }
})

app.post("/delete",(req,res)=>{
    const deleteId =req.body.checkbox; 
    const pageDetail=req.body.listName
     async function findAndDelete(){
        try{
            const result = await Item.findByIdAndDelete(deleteId);
            console.log("Successfully deleted",result)
        }catch(err){
            console.log(err);
        }
    }

    async function deleteFromList(){
        try{
            const result = await List.findOneAndUpdate({name:pageDetail},{$pull:{items:{_id:deleteId}}});
            console.log(result);
        }catch(err){
            console.log(err);
        }
    }
    if(pageDetail==day){
        findAndDelete();
        res.redirect("/");
    }else{
        deleteFromList();
        res.redirect("/"+pageDetail);
    }
   
    
})

app.get("/",(req,res)=>{

    async function findTasks(){
        try{
            const foundItems = await Item.find({});
            if(foundItems.length==0){
                insertTask();
                res.redirect("/");
            }else{
                res.render('list',{listTitle:day,addTask:foundItems});
            }
        }catch(err){
            console.log(err);
        }
    }
    findTasks();
})

app.get("/:list",(req,res)=>{
    const customList = _.capitalize(req.params.list);
    async function findList(){
        try{
            const result = await List.findOne({name:customList});
            if(!result){
                const list = new List({
                    name:customList,
                    items:defaultItems
                })
                list.save();
                res.redirect("/"+customList);
            }else{
                res.render('list',{listTitle:result.name,addTask:result.items})
            }
        }catch(err){
            console.log(err);
        }
    }
    findList();
    
 })

app.listen(3000,()=>{
    console.log("Server is listening");
})