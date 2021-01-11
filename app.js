const express = require('express')
const fetch = require('node-fetch')
const redis = require('redis')
const app = express()

const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.PORT || 6379
const client = redis.createClient(REDIS_PORT)


//set response
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} repos</h2>`
}

async function getRepos(req, res, next) {
    try {
        console.log('Fetching data...');

        let { username } = req.params

        let response = await fetch(`https://api.github.com/users/${username}`)
        let data = await response.json()

        let repos = data.public_repos

        //set to Redis
        client.setex(username, 120, repos)

        res.send(setResponse(username, repos))
    } catch (err) {
        console.error(err)
        res.status(500)
    }
}

//cache middleware
function cache(req, res, next) {
    let { username } = req.params
    client.get(username, (err, data) => {
        if(err) throw err

        if(data !== null) {
            res.send(setResponse(username, data))
        } else {
            next()
        }
    })
}

app.get('/repos/:username', cache,getRepos) 

app.listen(5000, () => console.log('server runnung'))