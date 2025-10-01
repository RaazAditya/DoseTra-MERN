import dotenv from 'dotenv';
import connectDB from './db/database.js';
import {app} from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
  app.on("error", (error) => {
    console.log("ERROR", error);
    throw error;
  });

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening at port ${process.env.PORT || 3000}`);
  });
})
.catch((err)=>{
    console.log("MONGODB connection failed!!", err);
})
