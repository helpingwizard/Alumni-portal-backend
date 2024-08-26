import express, { Router } from 'express';

const { filterPost, filterProfile } = require('../controllers/filterController');



const filterRoutes = Router();


// filter post 

filterRoutes.get('/post', filterPost);
filterRoutes.get('/profile', filterProfile);


module.exports = filterRoutes;



