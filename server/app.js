import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import neo4j from 'neo4j-driver';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import SatelliteRoutes from './routes/satelliteRoutes.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.get('/alive', (req, res) => {
    res.send('Hello World!');
}); 

app.use('/api', SatelliteRoutes.getRouter());

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

async function checkNeo4jConnectivity() {
    try {
        const serverInfo = await driver.getServerInfo();
        console.log('Server info:', serverInfo);
        console.log('Connected to Neo4j');
    } catch (error) {
        console.error('Error connecting to the Neo4j database', error);
    } finally {
        driver.close();
    }
}

checkNeo4jConnectivity();

//connect to redis cache
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

redis.on('connect', () => {
    console.log('Redis connected');
});

redis.on('error', (error) => {
    console.error('Redis connection error:', error);
});

export default app;