const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const neo4j = require('neo4j-driver');
const redis = require('redis');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());


// connect to mongodb
const mongodb_uri = process.env.MONGODB_URI;
mongoose.connect(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch(error => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });


// connect to neo4j db
const neo4j_uri = process.env.NEO4J_URI;
const neo4j_username = process.env.NEO4J_USERNAME;
const neo4j_password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(
    neo4j_uri,
    neo4j.auth.basic(neo4j_username, neo4j_password)
);
const session = driver.session();

async function checkConnectivity() {
    try {
        const serverInfo = await driver.getServerInfo();
        console.log('Server info:', serverInfo);
        console.log('Connected to Neo4j');
    } catch (error) {
        console.error('Error connecting to the database', error);
    } finally {
        driver.close();
    }
}

checkConnectivity();

module.exports = app;