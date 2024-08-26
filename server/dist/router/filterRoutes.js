"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const { filterPost, filterProfile } = require('../controllers/filterController');
const filterRoutes = (0, express_1.Router)();
// filter post 
filterRoutes.get('/post', filterPost);
filterRoutes.get('/profile', filterProfile);
module.exports = filterRoutes;
