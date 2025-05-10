import multer from 'multer';

const storage = multer.diskStorage({ 

    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {

        cb(null, file.originalname)
    }
    })
    
    export const upload = multer({ storage, })


    // explain the code of multer
    /*
    import multer from 'multer';
🟢 Importing the multer library –
multer is a Node.js middleware used for handling multipart/form-data, which is primarily used for uploading files.

javascript
Copy
Edit
const storage = multer.diskStorage({
🟢 Creating a storage engine –
This tells multer how and where to store uploaded files on the disk.
diskStorage() is a built-in method in multer.

It takes a config object with two required functions:

destination

filename

javascript
Copy
Edit
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
🟡 Setting upload destination folder:

destination defines where to save the file.

This function is called with three arguments:

req – the incoming request

file – the file being uploaded

cb – a callback function to tell multer where to store the file

👉 cb(null, "./public/temp")
Means: store the uploaded file in the ./public/temp folder.
null is passed as the first argument to indicate no error.

javascript
Copy
Edit
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
🟡 Setting the filename for the saved file:

This function is used to determine the name the file will be saved as.

file.originalname is the name of the file from the user's computer.

So this line saves the file with the same name it had when uploaded.

👉 You could also modify the name to prevent overwriting or add timestamps.

javascript
Copy
Edit
})
🟢 Ends the call to multer.diskStorage.

javascript
Copy
Edit
export const upload = multer({ storage, })
🟢 Exporting the configured multer middleware:

This line creates a multer instance using the storage config we defined.

upload is the middleware that you can use in your routes to handle file uploads.

✅ Example usage in a route:

javascript
Copy
Edit
app.post("/upload", upload.single("avatar"), (req, res) => {
    res.send("File uploaded successfully");
});
🔁 Summary:
This code:

Uses multer to handle file uploads

Saves uploaded files to ./public/temp

Keeps the original filename

Exports the configured upload middleware for use in Express routes 
*/