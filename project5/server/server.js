// Mike Brandin - CPSC 3750 - Project 5
const crypto = require('crypto'); 

//some webserver libs
const express = require('express');
const bodyParser = require('body-parser');
const auth = require('basic-auth');

//promisification
const bluebird = require('bluebird');

//database connector
const redis = require('redis');
//make redis use promises
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//create db client
const client = redis.createClient();

const port = process.env.NODE_PORT || 3000;

//make sure client connects correctly.
client.on("error", function (err) {
    console.log("Error in redis client.on: " + err);
});

const setUser = function(userObj){
	return client.hmsetAsync("user:"+userObj.id, userObj ).then(function(){
		console.log('Successfully created (or overwrote) user '+userObj.id);
	}).catch(function(err){
		console.error("WARNING: errored while attempting to create tester user account");
	});

}

//make sure the test user credentials exist
const userObj = {
	salt: new Date().toString(),
	id: 'teacher'
};
userObj.hash = crypto.createHash('sha256').update('testing'+userObj.salt).digest('base64');
//this is a terrible way to do setUser
//I'm not waiting for the promise to resolve before continuing
//I'm just hoping it finishes before the first request comes in attempting to authenticate
setUser(userObj);


//start setting up webserver
const app = express();

//decode request body using json
app.use(bodyParser.json());

//allow the API to be loaded from an application running on a different host/port
app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        res.header('Access-Control-Expose-Headers', 'X-Total-Count');
		res.header('Access-Control-Allow-Methods', "PUT, DELETE, POST, GET, HEAD");
        next();
});

//protect our API
app.use(function(req,res,next){
	switch(req.method){
		case "GET":
		case "POST":
		case "PUT":
		case "DELETE":
			//extract the given credentials from the request
			const creds = auth(req);			
			//look up userObj using creds.name
			//TODO use creds.name to lookup the user object in the DB
			//use the userObj.salt and the creds.pass to generate a hash
			//compare the hash, if they match call next() and do not use res object
			//to send anything to client
			//if they dont or DB doesn't have the user or there's any other error use the res object 
			//to return a 401 status code
			client.hgetallAsync('user:' + creds.name).then(function(data, err){
				hash = crypto.createHash('sha256').update(creds.pass + data.salt).digest('base64')
				if(hash == data.hash){
					next()
				}
				else{
					res.sendStatus(401)
				}
			}).catch(function(err){
				res.sendStatus(401)
			})
			
			break;
		default:
			//maybe an options check or something
			next();
			break;
	}
});

//this takes a set of items and filters, sorts and paginates the items.
//it gets it's commands from queryArgs and returns a new set of items
const filterSortPaginate = (type, queryArgs, items) =>{
	let keys;
	console.log(queryArgs)

	//create an array of filterable/sortable keys
	if(type == 'student'){
		keys = ['id','name'];
	}else{
		keys = ['id','student_id','type','max','grade'];
	}


	//applied to each item in items
	//returning true keeps item
	//TODO: fill out the filterer function
	const filterer = (item) =>{
		//loop through keys defined in above scope
			//if this key exists in queryArgs
			//and it's value doesnt match whats's on the item
			//don't keep the item (return false)
		for (const key of keys){
			if(queryArgs.hasOwnProperty(key)){				
				if(queryArgs[key]){
					if(!item[key].toUpperCase().includes(queryArgs[key].toUpperCase())){
						return false
					}
				}	
			}
		}
		//else return true
		return true
	};

	//apply above function using Array.filterer
	items = items.filter(filterer);
	console.log('items after filter:',items)

	//always sort, default to sorting on id
	if(!queryArgs._sort){
		queryArgs._sort = 'id';
	}
	//make sure the column can be sorted
	let direction = 1;
	if(!queryArgs._order){
		queryArgs._order = 'asc';
	}
	if(queryArgs._order.toLowerCase() == 'desc'){
		direction = -1;
	}

	//comparator...given 2 items returns which one is greater
	//used to sort items
	//written to use queryArgs._sort as the key when comparing
	//TODO fill out the sorter function
		const sorter = (a,b)=>{
		//Note direction and queryArgs are available to us in the above scope
		let val = 0;
		if(a[queryArgs._sort] > b[queryArgs._sort]){
				val = 1; 
		}
		else if(a[queryArgs._sort] < b[queryArgs._sort]){
				val = -1;	
		}
		else{
				val = 0;
		}
		//compare a[queryArgs._sort] (case insensitive) to the same in b
		//save a variable with 1 if a is greater than b, -1 if less and 0 if equal
		
		//multiply by direction to reverse order and return the variable
		return (val * direction);
	};

	//use apply the above comparator using Array.sort
	items.sort(sorter);
	console.log('items after sort:',items)
	//if we need to paginate
	// TENTATIVELY DONE
	if(queryArgs._start || queryArgs._end || queryArgs._limit){
		//TODO: fill out this if statement
		//define a start and end variable
		//start defaults to 0, end defaults to # of items
		let start = 0
		let end = items.length
		//if queryArgs._start is set, save into start
		if (queryArgs._start){
			start = queryArgs._start
		}		
		//if queryArgs._end is set save it into end
		if (queryArgs._end){
			end = queryArgs._end
		}
		//	else if queryArgs._limit is set, save end as start+_limit
		else if (queryArgs._limit){
			end = start + queryArgs._limit
		}

		//save over items with items.slice(start,end)
		items = items.slice(start, end);

	}
	//console.log(queryArgs)
	console.log('items after pagination:',items)
	return items;
};


// TENATIVELY DONE
app.get('/students/:id',function(req,res){
	//TODO
	//Hint use hgetallAsync
	client.hgetallAsync("student:" + req.params.id).then(function(data, err){
		res.status(200).json({"id":data.id, "name":data.name, "_ref": req.path})
	}).catch(function(err) {
		res.status(404).send()
	})
});


app.get('/students',function(req,res){
	//TODO fill out the function
	//Hint: use smembersAsync, then an array of promises from hgetallAsync and 
	//Promise.all to consolidate responses and filter sort paginate and return them
	client.smembersAsync("students").then(function(students) {
		const promises = []
		let info = []
		for (const student of students){
			promises.push(
				client.hgetallAsync("student:"+student).then(function(data){
					info.push(data)
				})
			)
		}
		
		Promise.all(promises).then(function() {
			info = filterSortPaginate("student", req.query, info)
			res.status(200).set('X-Total-Count', info.length).json(info)
		})
	})
});


app.post('/students',function(req,res){
	//TODO
	//Hint: use saddAsync and hmsetAsync
	client.sismemberAsync("students", req.body.id).then(function(exist){
		if(!exist){
			client.hmsetAsync("student:" + req.body.id, "name", req.body.name, "id", req.body.id).then(function() {
				client.saddAsync("students",req.body.id).then(function() {
					res.status(200).json({"_ref": req.path+"/"+req.body.id, "id":req.body.id})
				}).catch(function(err) {
					res.sendStatus(400)
					})
			}).catch(function(err) {
				res.sendStatus(400)
			})
		}
		else {
			res.sendStatus(400)
		}
	}).catch(function(err) {
		res.sendStatus(400)
	})		
});

app.delete('/students/:id',function(req,res){
	//TODO
	//Hint use a Promise.all of delAsync and sremAsync
	client.existsAsync('student:' + req.params.id).then((data) =>{
		if(data != 0){
			const promises = []
			promises.push(client.delAsync('student:' + req.params.id), client.sremAsync('students', req.params.id))
			
			Promise.all(promises).then(()=>{
					res.status(200).json({id: req.params.id})
			})
		}	
		else{
			res.sendStatus(404)
		}
	})
		 
});

app.put('/students/:id',function(req,res){
	//TODO
	//Hint: use client.hexistsAsync and HsetAsync
	if(!req.body || req.body.id){
		res.sendStatus(400)
	}
	else{
		client.existsAsync('student:' + req.params.id).then(() =>{
			client.hsetAsync('student:' + req.params.id, 'name', req.body.name)
		})
		res.sendStatus(200)
	}

});

app.post('/grades',function(req,res){
	//TODO
	//Hint use incrAsync and hmsetAsync
	client.incrAsync("grades").then(function(grades, err){
		client.hmsetAsync("grade:" + grades, "student_id", req.body.student_id, "type", req.body.type, "max", req.body.max, "grade", req.body.grade, "id", grades).then(function(){
			res.status(200).json({"_ref": req.path + "/" + String(grades), "id": String(grades)})
		}).catch(function(err){
			res.sendStatus(400)
		})
	}).catch(function(err) {
		res.sendStatus(400)
	})

});

app.get('/grades/:id',function(req,res){
	//TODO
	//Hint use hgetallAsync
	client.hgetallAsync("grade:" + req.params.id).then(function(data) {
		res.status(200).send(data)
	}).catch(function(err) {
		res.sendStatus(400)
	})
});

app.put('/grades/:id',function(req,res){
	//TODO
	//Hint use hexistsAsyncand hmsetAsync
	if(!req.body){
		res.sendStatus(400)
	}

	client.existsAsync('grade:'+ req.params.id).then((data)=>{
			if (data != 0){
				client.hsetAsync('grade:' + req.params.id, 'grade', req.body.grade)
				res.sendStatus(200)
			}
			else{
				res.sendStatus(404)
			}
		})

});
app.delete('/grades/:id',function(req,res){
	//TODO
	//Hint use delAsync .....duh
	client.existsAsync('grade:' + req.params.id).then((data) =>{
		if(data !=0){
			client.delAsync('grade:' + req.params.id)
			return res.sendStatus(200)
		}
		else{
			return res.sendStatus(404)
		}
	})
});

app.get('/grades',function(req,res){
	//TODO
	//Hint use getAsync, hgetallAsync
	//and consolidate with Promise.all to filter, sort, paginate
	client.getAsync('grades').then((data)=>{
		const promises = []
		const grades = []

		if(data == null){
			data = 0;
		}

		res.setHeader('X-Total-Count', data)

		for(let i = 0; i <= data; i++){
			promises.push(client.hgetallAsync('grade:' + i).then((value) =>{
				if(value != null){
					grades.push(value)
				}
			}))
		}

		Promise.all(promises).then(()=>{
				res.status(200).json(filterSortPaginate('grade', req.query, grades))
		})
	})
	
});


app.delete('/db',function(req,res){
	client.flushallAsync().then(function(){
		//make sure the test user credentials exist
		const userObj = {
			salt: new Date().toString(),
			id: 'teacher'
		};
		userObj.hash = crypto.createHash('sha256').update('testing'+userObj.salt).digest('base64');
		//this is a terrible way to do setUser
		//I'm not waiting for the promise to resolve before continuing
		//I'm just hoping it finishes before the first request comes in attempting to authenticate
		setUser(userObj).then(()=>{
			res.sendStatus(200);
		});
	}).catch(function(err){
		res.status(500).json({error: err});
	});
});

app.listen(port, function () {
  console.log('Example app listening on port '+port+'!');
});