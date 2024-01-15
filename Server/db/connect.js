const mongoose = require('mongoose')

mongoose.set(`strictQuery`, true);

const connectDB = (URL) => {
  //  this returns a promise
  return mongoose.connect(URL, {     //  if you arent using .env then pass connectionString else pass url
              useNewUrlParser: true,
              // useCreateIndex: true,        // these two are not required in the mongoose version ^6.12.3
              // useFindAndModify: false,
              useUnifiedTopology: true,
          })
}

module.exports = connectDB;
