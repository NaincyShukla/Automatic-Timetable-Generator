const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://naincyshukla2310_db_user:BulublUe@cluster0.qzsfj5p.mongodb.net/?appName=Cluster0"
  )
  .then(() => {
    console.log("Connected Successfully");
    process.exit();
  })
  .catch((err) => {
    console.log(err);
    process.exit();
  });