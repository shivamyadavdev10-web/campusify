import mongoose from "mongoose";

const dbConnect = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("mongoDB connected sucessfully");
    }
    catch(error){
        console.error("mongoDB connection faild",error);
        process.exit(1);
    }
};
export default dbConnect;