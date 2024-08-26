import express, { Router } from 'express';
import { generateURL } from "../controllers/s3Controller";
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const multer = require('multer')
const upload = multer({ dest: 'uploads/' })


const s3Router:Router = express.Router()

s3Router.get('/', generateURL);
module.exports = s3Router;