var mongoose = require('mongoose'),
    owl = require('owl-deepcopy');

var Schema = mongoose.Schema,
    Model = mongoose.Model;

/**
 * Add a new function to the schema prototype to create a new schema by extending an existing one
 */
Schema.prototype.extend = function(obj, options) {
  // Deep clone the existing schema so we can add without changing it
  var newSchema = owl.deepCopy(this);

  newSchema.options.__isExtended = true;
  
  // Fix for callQueue arguments, todo: fix clone implementation
  newSchema.callQueue.forEach(function(k) {
    var args = [];
    for(var i in k[1]) {
      args.push(k[1][i]);
    }
    k[1] = args;
  });

  // Override the existing options with any newly supplied ones
  for(var k in options) {
    newSchema.options[k] = options[k];
  }

  // This adds all the new schema fields
  newSchema.add(obj);

  var key = newSchema.options.discriminatorKey;
  if(key) {
    // If a discriminatorField is in the schema options, add a new field to store model names
    var discriminatorField = {};
    discriminatorField[key] = { type : String };
    newSchema.add(discriminatorField);

    // When new documents are saved, include the model name in the discriminatorField
    // if it is not set already.
    newSchema.pre('save', function(next) {
      if(this[key] === null || this[key] === undefined) {
        this[key] = this.constructor.modelName;
      }
      next();
    });
  }

  return newSchema;
};

/**
 * Wrap the model init to set the prototype based on the discriminator field
 */
var oldInit = Model.prototype.init;
Model.prototype.init = function(doc, query, fn) {
  var key = this.schema.options['discriminatorKey'];
  if(key) {

    // If the discriminatorField contains a model name, we set the documents prototype to that model
    var type = doc[key];
    if(type) {
      // this will throw exception if the model isn't registered
      var model = this.db.model(type);
      var newFn = function() {
        // this is pretty ugly, but we need to run the code below before the callback
        process.nextTick(function() {
          fn.apply(this, arguments);
        });
      }
      var modelInstance = new model();
      this.schema = model.schema;
      var obj = oldInit.call(this, doc, query, newFn);
      obj.__proto__ = model.prototype;
      return obj;
    }
  }

  // If theres no discriminatorKey we can just call the original method
  return oldInit.apply(this, arguments);
}



/*** NEW METHODS ***/
/** The following methods allow you to use queries to find specific types of objects. **/



function getArguments(self, conditions, fields, options, callback) {
  if ('function' == typeof conditions) {
    callback = conditions;
    conditions = {};
    fields = null;
    options = null;
  } else if ('function' == typeof fields) {
    callback = fields;
    fields = null;
    options = null;
  } else if ('function' == typeof options) {
    callback = options;
    options = null;
  }


  if (typeof conditions == 'undefined') {
    conditions = {};
  }
 

  
  return {
    conditions: conditions,
    field: fields,
    options: options,
    callback: callback
  }
}



function addDiscriminatorConditions(self, conditions) {
  /** This only allows for one level of inheritance */
  if (self.schema.options.__isExtended) {
    var discriminatorKey = self.schema.options.discriminatorKey;
    var discriminatorValue = self.modelName;
    conditions[discriminatorKey] = discriminatorValue;
  }
}



var oldFind = Model.find;
Model.find = function(conditions, fields, options, callback) {
  
  var findArgs = getArguments(this, conditions, fields, options, callback); 
  
  addDiscriminatorConditions(this, findArgs.conditions);
  
  return oldFind.call(this, findArgs.conditions, findArgs.fields, findArgs.options, findArgs.callback);
  
}

Model.findById = function(id, fields, options, callback) {

  var findArgs = getArguments(this, id, fields, options, callback); 
  
  findArgs.conditions = { _id: id };
  addDiscriminatorConditions(this, findArgs.conditions);
  

  return oldFind.call(this, findArgs.conditions, findArgs.fields, findArgs.options, findArgs.callback);

}

var oldCount = Model.count;
Model.count = function(conditions, callback) {
  if (typeof conditions == 'function') {
    conditions = {}
    callback = conditions;
  }

  addDiscriminatorConditions(this, conditions);

  return oldCount.call(this, conditions, callback);

}

var oldUpdate = Model.update;
Model.update = function(conditions, update, options, callback) {
  var args = getArguments(this, conditions, update, options, callback);

  addDiscriminatorConditions(this, args.conditions);

  return oldUpdate.call(this, args.conditions, args.fields, args.options, args.callback);
}