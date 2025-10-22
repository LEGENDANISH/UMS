const express = require("express");
const app = express();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

app.listen(3000,()=>{
    console.log("server is on")
})
