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
const { addCompany, deleteCompany, addDomain, deleteDomain, addskills, deleteSkill, addUniversity, getAllDomains } = require("./domainController");
exports.getAllProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield db_1.client.query('SELECT * FROM user_profile');
        let user_profiles = [];
        for (let i = 0; i < response.rows.length; i++) {
            let uid = response.rows[i].fk_university_id;
            const query = `SELECT * FROM university WHERE university_id = ${uid}`;
            const responseRow = yield db_1.client.query(query);
            const uniName = responseRow.rows[0].university_name;
            user_profiles.push({
                profile: response.rows[i],
                name: uniName
            });
        }
        res.status(200).json(user_profiles);
    }
    catch (err) {
        res.status(401).send(err);
    }
});
exports.postUserProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fk_user = req.user.user_id;
        // console.log("fk_user: ", fk_user)
        const { fk_university_id, profile_image, about_me, git_profile, linkedin, user_resume, portfolio, experience, suggestion, domains, skills, companies } = req.body;
        let query = 'INSERT INTO user_profile (fk_user, fk_university_id, profile_image, about_me, git_profile, linkedin, user_resume, portfolio, experience, suggestion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING profile_id, profile_image';
        const params = [
            fk_user,
            fk_university_id,
            profile_image,
            about_me,
            git_profile,
            linkedin,
            user_resume,
            portfolio,
            experience,
            suggestion
        ];
        const response = yield db_1.client.query(query, params);
        const profile_id = response.rows[0].profile_id;
        // Insert domains
        domains.forEach((domain) => __awaiter(void 0, void 0, void 0, function* () {
            const domain_name = domain;
            const text = `SELECT domain_id FROM domain WHERE domain_name = $1;`;
            const domain_data = yield db_1.client.query(text, [domain_name]);
            var domain_id;
            if (domain_data.rowCount === 0) {
                const addQuery = `INSERT INTO domain (domain_name) VALUES ($1) RETURNING domain_id;`;
                const domain_data2 = yield db_1.client.query(addQuery, [domain_name]);
                domain_id = domain_data2.rows[0].domain_id;
            }
            else {
                domain_id = domain_data.rows[0].domain_id;
            }
            const check = yield db_1.client.query("Select * from user_domain where fk_user = $1 and fk_domain_id = $2", [profile_id, domain_id]);
            if (check.rows.length >= 1) {
                return res.status(409).json({ error: "User already have this domain" });
            }
            const mapQuery = `INSERT INTO user_domain (fk_user,fk_domain_id) VALUES($1,$2);`;
            const values = [profile_id, domain_id];
            const map_data = yield db_1.client.query(mapQuery, values);
            // console.log(map_data)
        }));
        // Insert skills
        skills.forEach((skill) => __awaiter(void 0, void 0, void 0, function* () {
            const skill_name = skill;
            const text = `SELECT skill_id FROM skills WHERE skill_name = $1;`;
            const skill_data = yield db_1.client.query(text, [skill_name]);
            let skill_id;
            if (skill_data.rowCount === 0) {
                const addQuery = `INSERT INTO skills(skill_name) VALUES ($1) RETURNING skill_id;`;
                const skill_data2 = yield db_1.client.query(addQuery, [skill_name]);
                skill_id = skill_data2.rows[0].skill_id;
            }
            else {
                skill_id = skill_data.rows[0].skill_id;
            }
            // Check if the entry already exists in user_skills table
            const checkDuplicateQuery = `SELECT * FROM user_skills WHERE fk_user = $1 AND fk_skill_id = $2;`;
            const duplicateCheckResult = yield db_1.client.query(checkDuplicateQuery, [profile_id, skill_id]);
            if (duplicateCheckResult.rowCount === 0) {
                const mapQuery = `INSERT INTO user_skills (fk_user, fk_skill_id) VALUES ($1, $2);`;
                const values = [profile_id, skill_id];
                yield db_1.client.query(mapQuery, values);
            }
            else {
                res.status(400).json({ message: "Skill is already associated with this profile." });
            }
        }));
        // Insert companies
        companies.forEach((company) => __awaiter(void 0, void 0, void 0, function* () {
            const { company_name, job_role, contribution, begin_date, last_date } = company;
            const checkCompanyQuery = `SELECT companies_id FROM companies WHERE company_name = $1;`;
            const companyData = yield db_1.client.query(checkCompanyQuery, [company_name]);
            let companies_id;
            if (companyData.rowCount === 0) {
                const addCompanyQuery = `INSERT INTO companies (company_name) VALUES ($1) RETURNING companies_id;`;
                const newCompanyData = yield db_1.client.query(addCompanyQuery, [company_name]);
                companies_id = newCompanyData.rows[0].companies_id;
            }
            else {
                companies_id = companyData.rows[0].companies_id;
            }
            const checkUserCompanyQuery = `
            SELECT * FROM user_companies
            WHERE fk_user = $1 AND fk_companies_id = $2;
        `;
            const checkUserCompanyData = yield db_1.client.query(checkUserCompanyQuery, [profile_id, companies_id]);
            if (checkUserCompanyData.rows.length >= 1) {
                return res.status(409).json({ error: "User already has this company" });
            }
            // Insert the relationship into the user_companies table
            const addUserCompanyQuery = `
            INSERT INTO user_companies (fk_companies_id, fk_user, job_role, contribution, begin_date, last_date)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
            let values;
            if (last_date.length === 0) {
                values = [companies_id, profile_id, job_role, contribution, new Date(begin_date), null];
            }
            else {
                values = [companies_id, profile_id, job_role, contribution, new Date(begin_date), new Date(last_date)];
            }
            yield db_1.client.query(addUserCompanyQuery, values);
        }));
        res.status(200).json({ message: 'Profile Created', profile: response.rows[0] });
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ error: 'Profile Not Created' });
    }
});
exports.getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const text = "select up.*,u.username,u.first_name,u.last_name,u.email,u.passout_year,u.phone,u.is_alumni from user_profile up JOIN users u on up.fk_user = u.user_id where profile_id = $1;";
        const data = yield db_1.client.query(text, [req.params.id]);
        if (data.rows.length <= 0) {
            return res.status(404).send({
                message: 'User Not Found'
            });
        }
        const profile = data.rows[0];
        const id = data.rows[0].fk_university_id;
        const user_id = data.rows[0].fk_user;
        const text2 = `select * from university  where university_id=${id};`;
        const data2 = yield db_1.client.query(text2);
        const name = data2.rows[0].university_name;
        const text3 = `SELECT 
                          d.*,
                          s.*,
                          c.company_name,
                          uc.*
                        FROM 
                        user_profile LEFT JOIN 
                          user_domain ud on ud.fk_user = user_profile.profile_id
                         Left Join 
                           domain d on d.domain_id = ud.fk_domain_id
                         Left Join 
                           user_skills us on us.fk_user = user_profile.profile_id
                         Left Join 
                           skills s on s.skill_id = us.fk_skill_id
                         Left Join 
                           user_companies uc on uc.fk_user = user_profile.profile_id
                         Left Join 
                           companies c on c.companies_id = uc.fk_companies_id          
                         where 
                         user_profile.profile_id = $1`;
        const params = [req.params.id];
        const result = yield db_1.client.query(text3, params);
        const domains = [];
        const skills = [];
        const companies = [];
        const domains_list = [];
        const skills_list = [];
        const companies_list = [];
        result.rows.forEach((row) => __awaiter(void 0, void 0, void 0, function* () {
            if (row.domain_id && !domains_list.includes(row.domain_id)) {
                domains_list.push(row.domain_id);
                domains.push({ "domain_id": row.domain_id, "domain_name": row.domain_name });
            }
            // Extract unique skills
            if (row.skill_id && !skills_list.includes(row.skill_id)) {
                skills_list.push(row.skill_id);
                skills.push({ "skill_id": row.skill_id, "skill_name": row.skill_name });
            }
            // Extract unique companies
            if (row.company_name && !companies_list.includes(row.company_name)) {
                companies_list.push(row.company_name);
                companies.push({
                    "company_name": row.company_name,
                    "fk_companies_id": row.fk_companies_id,
                    "job_role": row.job_role,
                    "contribution": row.contribution,
                    "begin_date": row.begin_date,
                    "user_companies_id": row.user_companies_id,
                    "last_date": row.last_date
                });
            }
        }));
        if (req.token) {
            const searcher_id = req.user.user_id;
            let text7 = "select * from user_profile where fk_user = $1;";
            const param = [searcher_id];
            let profile_id = yield db_1.client.query(text7, param);
            const searcher_profile = profile_id.rows[0].profile_id;
            text7 = "select * from followers where fk_follower_id = $1 and fk_following_id = $2;";
            const data7 = [searcher_profile, profile.profile_id];
            const follows = yield db_1.client.query(text7, data7);
            let follows_variable = false;
            if (follows.rows.length > 0) {
                follows_variable = true;
            }
            else {
                follows_variable = false;
            }
            return res.status(200).json({
                profile,
                name,
                domains,
                skills,
                companies,
                follows_variable
            });
        }
        return res.status(200).json({
            profile,
            name,
            domains,
            skills,
            companies
        });
    }
    catch (err) {
        return res.send(err);
    }
});
exports.updateProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fk_user = req.user.user_id;
        const { id, fk_university_id, profile_image, about_me, git_profile, linkedin, user_resume, portfolio, experience, suggestion } = req.body;
        const response = yield db_1.client.query('UPDATE user_profile SET fk_user = $2 , fk_university_id = $3 , profile_image = $4, about_me = $5, git_profile = $6, linkedin = $7, user_resume = $8, portfolio = $9, experience = $10, suggestion = $11  WHERE profile_id = $1', [
            id,
            fk_user,
            fk_university_id,
            profile_image,
            about_me,
            git_profile,
            linkedin,
            user_resume,
            portfolio,
            experience,
            suggestion
        ]);
        res.status(200).json({ message: 'User updated successfully!' });
    }
    catch (err) {
        console.log(err);
        res.status(401).json({ error: 'User not updated successfully!' });
    }
});
exports.deleteProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleteProfile = yield db_1.client.query('DELETE FROM user_profile WHERE profile_id = $1', [id]);
        res.status(200).json({ message: 'User deleted successfully!' });
    }
    catch (err) {
        console.error(err);
        res.status(401).json({ message: 'User deleted successfully!' });
    }
});
exports.follow_unfollow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { action, profile_id } = req.body;
        const friend_id = req.params.id;
        if (action) {
            const text = "insert into followers values($1,$2)";
            let params = [profile_id, friend_id];
            let result = yield db_1.client.query(text, params);
            result = yield db_1.client.query("update user_profile set followers = followers + 1 where profile_id = $1", [friend_id]);
            res.status(200).json({ message: `${profile_id} has now followed ${friend_id}` });
        }
        else {
            const text = "delete from followers where fk_follower_id = $1 AND fk_following_id = $2";
            let params = [profile_id, friend_id];
            let result = yield db_1.client.query(text, params);
            result = yield db_1.client.query("update user_profile set followers = followers - 1 where profile_id = $1", [friend_id]);
            res.status(200).json({ message: `${profile_id} has now unfollowed ${friend_id}` });
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server error" });
    }
});
