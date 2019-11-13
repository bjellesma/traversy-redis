const express = require('express')
const fetch = require('node-fetch')
const redis = require('redis')

const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)

const app = express()

function setResponse(username, repos){
    return `<h2>${username} has ${repos} repos</h2>`
}

async function getRepos(req, res, next){
    try{
        console.log('fetch data')

        const {username} = req.params

        const response = await fetch(`https://api.github.com/users/${username}`)
        //wait for data to be received
        const data = await response.json();

        const repos = data.public_repos
        //set to redis
        //set key value pair of username:repos
        client.setex(username, 3600, repos)

        res.send(setResponse(username, repos))
    } catch(err){
        console.error(err)
        res.status(500)
    }
}

// Cache middleware
// middleware just runs between the request/response cycle

function cache(){
    const {username} = req.params 
    client.get('username', (err, data) => {
        if(err){
            throw err 
        }
        if(data !== null){
            res.send(setResponse(username, data));
        }else{
            next()
        }
    })
}
//using cache on app.get will get the caching function first
app.get('/repos/:username', cache, getRepos)

app.listen(5000, () => {
    console.log('server running')
})