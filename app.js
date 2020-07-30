const express=require('express');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const _=require('lodash');
const app=express();

var items=[]; // to keep a list of items
var work_list=[]; // to keep list of work items

mongoose.connect('mongodb+srv://admin-123:test_123@cluster0-tcgqd.mongodb.net/app_data', {useNewUrlParser: true,useUnifiedTopology: true});// connects to mongodb myapp

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Succesfully connected to mongo shell");
});

var thread_call=false;

// mongoose Schema is a structure of the data that it should have in that data base
const itemSchema=mongoose.Schema({
    Name:String
});

const Item=mongoose.model('Item',itemSchema);

const ListSchema=mongoose.Schema({ // by using express routing 
    title:String,
    data:[itemSchema]
});

const List=mongoose.model('List',ListSchema); // this will create a collection named lists in mongodb



/*let DataScience=new Item({
    Name:"DataScience"
});

let MachineLearning=new Item({
    Name:"MachineLearning"
});

let Ai=new Item({
    Name:"Artifitial Inteligence"
}); */

/*Item.insertMany([DataScience,MachineLearning,Ai],function(err,docs){
    if(err){
        console.log(err);
    }
    else{
        docs.forEach(function(item){
            items.push(item.Name);
        });// this resembles python map
    }
});*/




app.set('view engine',"ejs"); // to requie ejs controle flow

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static('public')); // to get all the images and files present in local directory

/*function encoder(x){
    switch(x)
    {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thusrday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        default:
            return "Error";
    }
}*/

app.get('/',function(req,res){ //getting root rout
    var today=new Date();
    var options={
        weekday:"long",
        day:"numeric",
        month:"long"
    }
    //console.log("pre request");// res.redirect('/') is not working as a recursive call insted its keep a thread
    // as completing the function and then exicuting that thread
    if(items.length===0){
        // Actually Item.find() was taking more time so java script thread first exicuted if test and the the Item.find() function
        // which resulted in errors and multiple calls 
        // so onces the find operation is finished inside the find() we can redirect to home rout
        Item.find({},function(err,docs){
            if(err){
                console.log(err);
            }
            else{
                //console.log('called');
                for(let i=0;i<docs.length;i++)
                {
                    items.push(docs[i]);
                }
                thread_call=true;
                //console.log("thread call is "+ thread_call);
                if(thread_call==true && items.length!=0){
                    res.redirect('/');
                }
                else{
                    var day=today.toLocaleDateString("en-IN",options);
                    res.render('list',{kindOfday:day,NewItem:items});
                }
            }
        });
        //console.log("post request");
        //console.log("if test");
    }
    else{
        //console.log("test");
        var day=today.toLocaleDateString("en-IN",options);
        res.render('list',{kindOfday:day,NewItem:items}); // places day string into indofday object in llist.ejs
    }
});

// local host:3000/work
/*app.get('/work',function(req,res){
    res.render('list',{kindOfday:"WorkList",NewItem:work_list});
});*/

app.get('/:rout',function(req,res){
    const rout=_.capitalize(req.params.rout);
    //console.log(rout); to debugging
    List.findOne({title:rout},function(err,docs){
        if(err){
            console.log(err);
        }
        else{
           if(docs==null){
            res.render('list',{kindOfday:rout,NewItem:[]});
           }
           else{
            res.render('list',{kindOfday:rout,NewItem:docs.data});
           }
        }
    });
});


async function remove_record(req,res){
    //console.log('hellow'); for debugginh
    //console.log(req.params);
    let check_list=req.body.check;
    var title=_.capitalize(req.params.rout);
    var present_check_list={}; // hash map
    //console.log(check_list);
    if(check_list==undefined){ // if no element is selected and clear button is pressed then no action is required
        res.redirect('/'+title);
        return ;
    }
    if(typeof(check_list)=="string"){ // only one is selected
        present_check_list[check_list]=true;
    }
    else{
        check_list.forEach(function(element){
            present_check_list[element]=true;
        });
    }
    {
        //console.log('correct thread is called');
        let thread=false;
        await List.findOne({title:title},function(err,docs){
            if(err){
                console.log(err);
            }
            else{
                let A=[];
                let doc=docs.data;
                doc.forEach(element => {
                    if(!present_check_list[element._id]){
                        A.push(element);
                    }
                });
                docs.data=A;
                docs.save();
                //console.log('remove query is completed');
                /*thread=true;// to ensure that findOne function is completed
                if(thread==true){
                    res.redirect('/'+title);
                }*/
            }
        });
    }
    /*Item.deleteOne({Name:items[index]},function(err){
        if(err){
            console.log(err);
        }
        else{
            items.pop();
            res.redirect('/');
        }
    });*/
}

app.post('/:rout',async function(req,res){
    const rout=_.capitalize(req.params.rout);
    var input_text=req.body.input_text;
    var clear_command=req.body.Clear_button;
    //console.log(clear_command);
    if(clear_command=="delete"){
        await remove_record(req,res);
        //console.log('page is redirected');
        res.redirect('/'+rout);
    }
    else
    {
        //console.log(input_text);
        List.findOne({title:rout},function(err,docs){
            if(err){
                console.log(err);
            }
            else{
                if(docs==null){
                    //console.log('new record is created');
                    let new_item=new Item({
                        Name:input_text
                    });
                    var list_item=new List({
                        title:rout,
                        data:[new_item]
                    });
                    list_item.save();
                    res.redirect('/'+rout);
                }
                else{
                    //console.log(input_text);
                    let new_item=new Item({
                        Name:input_text
                    });
                    if(input_text==="")
                    {
                        //console.log('empty text is entered');
                        res.redirect('/'+rout);
                    }
                    else if(input_text==undefined){
                        res.redirect('/'+rout);
                    }
                    else{
                        docs.data.push(new_item);
                        docs.save();
                        res.redirect('/'+rout);
                    }
                }
            }
        });
    }
});



app.post('/',function(req,res){
    // so we are handing both home and work pages post request here
    //console.log(req.body);
    var item=req.body.input_text;
    var clear_command=req.body.Clear_button;
    var check_list=req.body.check;
    //console.log('test');
    if(check_list==undefined){// this means add button was pressed or clear button was pressend with no selected items
        if(item==""){
            res.redirect('/');
            //console.log("Empty request");
        }
        else if(item==undefined){
            res.redirect('/');
        }
        else{
            db_item=new Item({
                Name:item
            });
            items.push(db_item);
            db_item.save();
            res.redirect('/');
        }
        return ;
    }
    if(clear_command!=undefined)
    {
        var present_check_list={}; // hash map
        if(typeof(check_list)=="string"){
            present_check_list[check_list]=true;
        }
        else{
            check_list.forEach(function(element){
                present_check_list[element]=true;
            });
        }
        if(typeof(check_list)=="string"){ // that mean a sinlge item is check which is passed as string
            Item.deleteOne({_id:check_list},function(err){
                if(err){
                    console.log(err);
                }
            });
            items=[];
            res.redirect('/');
        }
        else if(check_list!=undefined){ // multiples items are selected that mean req has send us an array
            n=check_list.length
            for(let i=0;i<n;i++)
            {
                Item.deleteOne({_id:check_list[i]},function(err){
                    if(err){
                        console.log(err);
                    }
                });
            }
            items=[];
            res.redirect('/');
        }
        else{ // nothing is selected to delete
            res.redirect('/');
        }
    }
    //console.log(item);
    /*if(req.body.addButton=='WorkList' || req.body.Clear=="WorkList")
    {

        // as we recive responce from html form object which submits all its data to local host
        // we define a logic in local host post method that is we open worklist
        // web and click we assigned a different value to button 
        // so that data can be added to work list global object and this same responce is
        // redirected to /work  page
        let data=req.body.input_text;
        if(data=="")
        {
            res.redirect('/work');
        }
        else if(data==undefined){
            work_list.pop();
            res.redirect('/work');
        }
        else{
            work_list.push(data);
            res.redirect('/work'); // this is equlivalent to return statemant
        }
       
    }*/
});





app.listen(process.env.PORT||3000,function(){
    console.log('3000 port is ready to serve');
});