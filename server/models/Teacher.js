const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({

    employeeId:{
        type:String,
        required:true,
        unique:true
    },

    name:{
        type:String,
        required:true
    },

    subjects:[{
        type:String
    }],

  //  maxHoursPerWeek:{
       // type:Number,
       // default:18
   // }

});

module.exports = mongoose.model("Teacher", teacherSchema);