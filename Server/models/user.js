const mongoose = require(`mongoose`);
const validator = require(`validator`); //  if we use this package we donot need match to validate the email
const bcrypt = require(`bcryptjs`);
const { string } = require("joi");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, `Please enter name`],
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        required: [true, `Please povide email`],
        // match: [
        //     /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        //     'Please provide a valid email',
        // ],

        //  either use match or use validate directly from the package to validate the email
        validate: {
            validator: validator.isEmail,
            message: `Please provide valid email`,
        },
        unique: true,
    },
    password: {
        type: String,
        required: [true, `Please provide password`],
        minlength: 6,
    },
    role: {
        type: String,
        emum: ['admin','user'],
        default: 'user',
    },
    verificationToken: String,
    isVerified: {
        type: Boolean,
        default: false,
    },
    verified: Date,
    passwordToken: {
        type: String,
    },
    passwordTokenExpirationDate: {
        type: Date,
    },
});

//  this.isModifiedPaths() returns an array of all the paths that were mofified
//  this again works only for the case when we use User.save() seperately
userSchema.pre(`save`, async function() {
    // console.log("hello");
    // console.log(this.isModifiedPaths());
    if(!this.isModified(`password`))   return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}

module.exports = mongoose.model(`User`, userSchema);