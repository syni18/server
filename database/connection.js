import mongoose from "mongoose";

async function connect(){
    mongoose.set('strictQuery',true);

    const db = await mongoose.connect(process.env.DB_ATLAS_URI,{
        dbName: process.env.DB_NAME, // Specify the database name here
    });

    console.log(`Database connected to ${process.env.DB_NAME}`);
    return db;
}
export default connect;