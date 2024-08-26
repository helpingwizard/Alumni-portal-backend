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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../model/db");
const GetAllInternships = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const getQuery = `SELECT i.internship_id,
        up.profile_id,
        up.profile_image,
        u.first_name,
        u.last_name,
        i.company_name,
        i.job_role,
        i.duration,
        i.address_,
        i.requirements,
        i.stipend,
        i.link_to_apply,
        i.posted_at
        FROM internship i
        JOIN user_profile up ON i.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        order by posted_at desc;`;
        const result = yield db_1.client.query(getQuery);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
const AddInternship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile_id = req.isUserHasProfile.profile_id;
        const { company_name, job_role, duration, address, requirements, stipend, tag, link_to_apply } = req.body;
        if (!profile_id || !company_name || !job_role || !duration || !address || !requirements || !stipend || !link_to_apply || !tag) {
            return res.status(400).json({ message: "Please fill all the fields!" });
        }
        if (profile_id && company_name && job_role && duration && requirements && link_to_apply && address && stipend && tag) {
            // const durationInSeconds = duration / 1000; // Convert duration from milliseconds to seconds
            // const stipendValue = parseFloat(stipend); // Ensure stipend is parsed as a float
            const PostQuery = `
                INSERT INTO internship
                (fk_user_id, company_name, job_role, duration, address_, requirements, stipend, tag, link_to_apply, posted_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10));`;
            const params = [
                profile_id,
                company_name,
                job_role,
                duration, // Use duration in seconds
                address,
                requirements,
                stipend, // Use parsed stipend value
                tag,
                link_to_apply,
                Date.now() / 1000 // Convert milliseconds to seconds for timestamp
            ];
            yield db_1.client.query(PostQuery, params);
            res.status(200).json({ message: " Internship Added Successfully!" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error in adding internship!' });
    }
});
const GetAllWorks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const getQuery = `SELECT w.work_id,
        up.profile_id,
        up.profile_image,
        u.first_name,
        u.last_name,
        w.company_name,
        w.job_role,
        w.address_,
        w.requirements,
        w.stipend,
        w.link_to_apply,
        w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        order by posted_at desc;`;
        const result = yield db_1.client.query(getQuery);
        res.status(200).json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
const AddWork = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile_id = req.isUserHasProfile.profile_id;
        //changes have ahet 
        const { company_name, job_role, address, requirements, salary, tag, link_to_apply } = req.body;
        if (!company_name || !job_role || !address || !requirements || !salary || !link_to_apply || !tag) {
            return res.status(400).json({ message: "please fill the all fields!" });
        }
        if (company_name && job_role && requirements && link_to_apply && address && salary && tag) {
            const PostQuery = `
                INSERT INTO work
                (fk_user_id, company_name, job_role,address_, requirements, stipend, tag, link_to_apply, posted_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9));`;
            const params = [profile_id, company_name, job_role, address, requirements, salary, tag, link_to_apply, Date.now() / 1000];
            yield db_1.client.query(PostQuery, params);
            res.status(200).json({ message: "Work Added Successfully !!" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'error in adding internship !!' });
    }
});
const DeleteInternship = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const internship_id = req.params.internship_id;
        if (!internship_id) {
            return res.status(400).json({ message: "internship id not found !" });
        }
        //changes have ahet 
        if (internship_id) {
            const DeleteQuery = `DELETE FROM internship WHERE internship_id=$1`;
            const params = [internship_id];
            yield db_1.client.query(DeleteQuery, params);
            res.status(200).json({ message: "Deleted Successfully !!" });
        }
        else {
            res.status(400).json({ status: false, message: "Not Deleted !" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'error in deleting internship !!' });
    }
});
const DeleteWork = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const work_id = req.params.work_id;
        if (!work_id) {
            return res.status(400).json({ message: "work id not found !" });
        }
        //changes have ahet
        if (work_id) {
            const DeleteQuery = `DELETE FROM work WHERE work_id=$1`;
            const params = [work_id];
            yield db_1.client.query(DeleteQuery, params);
            res.status(200).json({ message: "Deleted Successfully !!" });
        }
        else {
            res.status(400).json({ status: false, message: "Not Deleted !" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'error in deleting internship !!' });
    }
});
const InternshipFilter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = req.query.tags;
        if (!tags) {
            return res.status(400).json({ message: "select tags according to filter" });
        }
        const tagsArray = tags.split(",");
        //console.log(tagsArray);
        const getQuery = `
            SELECT i.internship_id,
                   up.profile_id,
                   up.profile_image,
                   u.first_name,
                   u.last_name,
                   i.company_name,
                   i.job_role,
                   i.tag,
                   i.duration,
                   i.address_,
                   i.requirements,
                   i.stipend,
                   i.link_to_apply,
                   i.posted_at
            FROM internship i
            JOIN user_profile up ON i.fk_user_id = up.profile_id
            JOIN users u ON up.fk_user = u.user_id
            WHERE i.tag && $1 -- Assuming the tag column is named "tag"
            ORDER BY i.posted_at DESC;
        `;
        const result = yield db_1.client.query(getQuery, [tagsArray]);
        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'NO DATA FOUND' });
        }
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
const WorkFilter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = req.query.tags;
        if (!tags) {
            return res.status(400).json({ message: "select tags according to filter" });
        }
        const tagsArray = tags.split(",");
        console.log(tagsArray);
        const getQuery = `SELECT w.work_id,
        up.profile_id,
        up.profile_image,
        u.first_name,
        u.last_name,
        w.company_name,
        w.job_role,
        w.address_,
        w.requirements,
        w.stipend,
        w.link_to_apply,
        w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        WHERE w.tag && $1
        order by posted_at desc;`;
        const result = yield db_1.client.query(getQuery, [tagsArray]);
        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'NO DATA FOUND' });
        }
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
module.exports = { GetAllInternships, AddInternship, GetAllWorks, AddWork, DeleteInternship, DeleteWork, InternshipFilter, WorkFilter };
