'use strict';
var assert = require("assert");
var mongoose = require('mongoose');
var extend = require('index.js');
var Promise = require("bluebird");

Promise.promisifyAll(mongoose);

mongoose.connect('mongodb://localhost/test');


var UserSchema = new mongoose.Schema({
	'first_name': { type: String },
	'last_name': { type: String },
	'email': { type: String, unique: true, sparse: true },
	'password': { type: String },
}, { collection : 'users', discriminatorKey : '_type'});




var StudentSchema = UserSchema.extend({
	"favorite_language" : { type: String } 
});


var TeacherSchema = UserSchema.extend({
	"university" : { type: String },
	"birthday"   : { type: Date }
});


var AdministratorSchema = UserSchema.extend({
	"admin_key" : { type: String }
});


var User = mongoose.model("User", UserSchema);
var Student = mongoose.model('Student', StudentSchema);
var Teacher = mongoose.model('Teacher', TeacherSchema);
var Administrator = mongoose.model('Administrator', AdministratorSchema);

Teacher.find();


// console.log("Model? " + (User instanceof mongoose.model));
// console.log("Schema? " + (User instanceof mongoose.Schema));

// process.exit();


var admin = new Administrator({
	first_name : "Kevin",
	last_name : "Mitchell",
	email : "kevin@okpanda.com",
	password: "abc123"
});

var sagan = new Teacher({
	first_name : "Carl",
	last_name : "Sagan",
	email : "carl.sagan@teacher.com",
	password: "def123"
});

var feynman = new Teacher({
	first_name : "Richard",
	last_name : "Feynman",
	email : "richard.feynman@teacher.com",
	password: "zzz111"
});



var fry = new Student({
	first_name : "Phillip",
	last_name : "Fry",
	email : "fry@student.com",
	password: "fff555"
});


var leela = new Student({
	first_name : "Leela",
	last_name : "Turanga",
	email : "leela@student.com",
	password: "iii111"
});

var hermes = new Student({
	first_name : "Hermes",
	last_name : "Conrad",
	email : "hermes@student.com",
	password: "12345"
});




User.removeAsync()
.then(function() {

	return Promise.all([
		admin.saveAsync(),
		sagan.saveAsync(),
		feynman.saveAsync(),
		fry.saveAsync(),
		leela.saveAsync(),
		hermes.saveAsync()
	])	
})
.spread(function() {
	admin.id = arguments[0][0];
	sagan.id = arguments[1][0];
	feynman.id = arguments[2][0];
	leela.id = arguments[3][0];
	hermes.id = arguments[4][0];

	console.log("admin id is " + admin.id);
})
.then(function() {
	return Promise.all([
		User.findAsync(),
		Administrator.findAsync(),
		Teacher.findAsync(),
		Student.findAsync(),
	]);

})
.spread(function(users, administrators, teachers, students) {
	assert.equal(users.length, 6);
	assert.equal(administrators.length, 1);
	assert.equal(teachers.length, 2);
	assert.equal(students.length, 3);
})
.then(function() {
	// return Promise.all([
	// 	User.findById(admin.id),
	// 	Administrator.findById(admin.id),
	// 	Teacher.findById(admin.id),
	// ])

	return User.findById(admin.id);
})
.then(function(user) {
	console.log(JSON.stringify(user.first_name, null, 2));
})








.then(function() {
	console.log("DONE");
	process.exit();
})

// .then(function() {
// 	return User.findAsync()
// })
// .then(function(users) {
// 	console.log("Users are : ");
// 	console.log(JSON.stringify(users, null, 2));
// })

.then(function() {
	return Teacher.findAsync()
})
.then(function(teachers) {
	console.log("Teachers are : ");
	console.log(JSON.stringify(teachers, null, 2));
})
// .then(function() {
// 	return Student.findAsync();
// })
// .then(function(students) {
// 	console.log("Students are : ");
// 	console.log(JSON.stringify(students, null, 2));
// })
// .then(function() {
// 	return Administrator.findAsync();
// })
// .then(function(admins) {
// 	console.log("Admins are : ");
// 	console.log(JSON.stringify(admins, null, 2));
// })












