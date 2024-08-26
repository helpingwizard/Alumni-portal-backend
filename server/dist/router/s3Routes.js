"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadFile, getFileStream } = require('../controllers/s3Controller');
const s3Routes = express_1.default.Router();
s3Routes.get('/images/:key', (req, res) => {
    console.log(req.params);
    const key = req.params.key;
    const readStream = getFileStream(key);
    readStream.pipe(res);
});
s3Routes.post('/images', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    console.log(file);
    // apply filter
    // resize 
    const result = yield uploadFile(file);
    yield unlinkFile(file.path);
    console.log(result);
    const description = req.body.description;
    res.send({ key: `${result.Key}` });
}));
exports.default = s3Routes;
