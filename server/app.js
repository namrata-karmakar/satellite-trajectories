import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import neo4j from "neo4j-driver";
import Redis from "ioredis";
import mongoose from "mongoose";
import SatelliteRoutes from "./routes/satelliteRoutes.js";
// import { MongoClient } from "mongodb";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.get("/alive", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", SatelliteRoutes.getRouter());

// connect to mongodb
const mongodb_uri = process.env.MONGODB_URI;
mongoose
  .connect(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
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
    console.log("Server info:", serverInfo);
    console.log("Connected to Neo4j");
  } catch (error) {
    console.error("Error connecting to the Neo4j database", error);
  }
}

await checkNeo4jConnectivity();

//connect to redis cache
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

////Swarali's usecase - start

app.get('/location', cache, getLatLong)

app.get('/records', getLatestRecords)

const issLocationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
}, {collection: 'iss_location'});

const issData = mongoose.model('issData', issLocationSchema);


let locationArray = [];

function cache(req, res, next) {
    console.log("Inside cache...")
    redis.exists(["latitude", "longitude"], (error, data1) => {
        if(error) throw error;
        if(data1 == 2){
            console.log("Exists...", data1)
            console.time('Cache Response Time');
            redis.mget(["latitude","longitude"], (erro, data2) => {
        
                if(erro) throw erro;
        
                if(data2 != null){
                    console.log("cache data...",data2)
                    console.timeEnd('Cache Response Time');
                    res.send(data2)
                } else {
                    next()
                }
            })
        }
        else{
            console.log("Does not exist...", data1)
            next()
        }
    })
}

async function getLatLong(req, res, next){
    try {
        console.log("Fetching data...")
        // console.time('API Response Time');
        const response = await fetch('http://api.open-notify.org/iss-now.json');
        const data = await response.json();
        const location = data.iss_position;
        console.log("location", location)
        const myResp = await storeLatLong(location, req, res);
        // console.log("myResp...",myResp)
        redis.setex("latitude",12,location.latitude)
        redis.setex("longitude",12,location.longitude)
        locationArray[0] = location.latitude
        locationArray[1] = location.longitude
        console.timeEnd('API Response Time');
        res.send(locationArray)
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

async function storeLatLong(location, req, res, next) {
    const newIssData = new issData({
        latitude: location.latitude,
        longitude: location.longitude,
    });

    return await newIssData.save()
}

async function getLatestRecords(req, res, next) {
    try {
        const latestRecords = await issData.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, latitude: '$latitude', longitude: '$longitude' } }
          ])
        .then((records) => {
            res.send(records)
          console.log(records);
        //   mongoose.connection.close();
        })
        .catch((err) => {
          console.error(err);
        //   mongoose.connection.close();
        });
    } catch (error) {
        console.error(error);
        res.status(500);
    }
}

////Swarali's usecase - end

export {app, driver};
