// https://assignment-3-iowi.onrender.com/

const http = require("http");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let services;
async function connectDB() {
    try {
        await client.connect();
        services = client.db("ServiceDB").collection("serviceCol");
        console.log("Connected to MongoDB");
    } catch (e) {
        console.error("MongoDB connection failed:", e);
        process.exit(1);
    }
}


const server = http.createServer((req, res) => {


    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'),
            (err, content) => {
                if (err) throw err;
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        );
    }
    else if (req.url === '/about') {
        fs.readFile(path.join(__dirname, 'about.html'),
            (err, content) => {
                if (err) throw err;
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        );
    }
    

    else  if (req.url === '/api' && req.method === 'GET') {
            // Your existing fetch-all code
            services.find({}).toArray()
                .then(results => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                })
                .catch(err => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Failed to fetch books" }));
                });
        }
        else if (req.url === '/api' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const book = JSON.parse(body);
                services.insertOne(book)
                    .then(result => {
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    })
                    .catch(err => {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Failed to add book" }));
                    });
            });
        }
        else if (req.url.startsWith('/api/') && req.method === 'PUT') {
            const id = Number(req.url.split('/')[2]);
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const updates = JSON.parse(body);
                // Remove _id and id from updates so they don't get overwritten
                delete updates._id;
                delete updates.id;
                services.updateOne(
                    { id: id },
                    { $set: updates }
                )
                .then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                })
                .catch(err => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Failed to update book" }));
                });
            });
        }
        else if (req.url.startsWith('/api/') && req.method === 'DELETE') {
            const id = Number(req.url.split('/')[2]);
            // const { ObjectId } = require('mongodb');
            services.deleteOne({ id: id })
                .then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                })
                .catch(err => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Failed to delete book" }));
                });
        }
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end("<h1>404 nothing is here</h1>");
    }
});
const PORT= process.env.PORT || 5959;

// port, callback
connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});