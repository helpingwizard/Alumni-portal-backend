import express, { Request, Response } from 'express'
import { client } from '../model/db'
import { convertToObject } from 'typescript';
import { isAuthenticated } from '../middleware/userMiddleware';
import { ReqMid } from '../types/user';
import { profile } from 'console';

exports.addCompany = async (req: ReqMid, res: Response) => {
    try {
        const profile_id = req.isUserHasProfile?.profile_id;
        if (profile_id) {
            const { company_name, job_role, contribution, begin_date, last_date } = req.body;


            const checkCompanyQuery = `SELECT companies_id FROM companies WHERE company_name = $1;`;
            const companyData = await client.query(checkCompanyQuery, [company_name]);

            let companies_id;
            if (companyData.rowCount === 0) {

                const addCompanyQuery = `INSERT INTO companies (company_name) VALUES ($1) RETURNING companies_id;`;
                const newCompanyData = await client.query(addCompanyQuery, [company_name]);
                companies_id = newCompanyData.rows[0].companies_id;
            } else {

                companies_id = companyData.rows[0].companies_id;
            }


            const checkUserCompanyQuery = `
            SELECT * FROM user_companies
            WHERE fk_user = $1 AND fk_companies_id = $2;
        `;
            const checkUserCompanyData = await client.query(checkUserCompanyQuery, [profile_id, companies_id]);

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
            await client.query(addUserCompanyQuery, values);

            res.status(200).json({ message: "Company added successfully" });
        } else {

        }

    } catch (err: any) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
};




exports.deleteCompany = async (req: ReqMid, res: Response) => {
    try {
        const profile_id = req.isUserHasProfile.profile_id;
        const { user_companies_id } = req.body;

        const checkCompanyQuery = `SELECT * FROM user_companies WHERE fk_user = $1 AND fk_companies_id = $2;`;
        const companyData = await client.query(checkCompanyQuery, [profile_id, user_companies_id]);
        if (companyData.rowCount === 0) {
            return res.status(404).json({ error: "Company not found for the user" });
        }
        const deleteCompanyQuery = `DELETE FROM user_companies WHERE fk_companies_id = $1;`;
        await client.query(deleteCompanyQuery, [user_companies_id]);

        res.status(200).json({ message: "Company deleted successfully" });

    } catch (err: any) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
};


exports.addDomain = async (req: ReqMid, res: Response) => {
    try {
        const profile_id = req.isUserHasProfile?.profile_id;
        const { domain_name } = req.body;
        const text = `SELECT domain_id FROM domain WHERE domain_name = $1;`;
        const domain_data = await client.query(text, [domain_name]);

        var domain_id;

        if (domain_data.rowCount === 0) {
            const addQuery = `INSERT INTO domain (domain_name) VALUES ($1) RETURNING domain_id;`;
            const domain_data2 = await client.query(addQuery, [domain_name]);
            domain_id = domain_data2.rows[0].domain_id;
        } else {
            domain_id = domain_data.rows[0].domain_id;
        }
        const check = await client.query("Select * from user_domain where fk_user = $1 and fk_domain_id = $2", [profile_id, domain_id]);
        if (check.rows.length >= 1) {
            return res.status(409).json({ error: "User already have this domain" });

        }
        const mapQuery = `INSERT INTO user_domain (fk_user,fk_domain_id) VALUES($1,$2);`;
        const values = [profile_id, domain_id];

        const map_data = await client.query(mapQuery, values);
        // console.log(map_data)
        res.status(200).json({ message: "domain added succesfully" });

    } catch (err: any) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
};



exports.deleteDomain = async (req: ReqMid, res: Response) => {
    try {
        const profile_id = req.isUserHasProfile.profile_id;
        const { domain_name } = req.body;
        const text = `
            DELETE FROM user_domain
            WHERE fk_user = $1
              AND fk_domain_id IN (SELECT domain_id FROM domain WHERE domain_name = $2);
        `;
        const values = [profile_id, domain_name];
        // console.log(domain_name);
        const data = await client.query(text, values);

        res.status(200).json({ message: `Domain deleted from profile ${profile_id} for domain_name ${domain_name}` });
    } catch (err: any) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
};

exports.addskills = async (req: ReqMid, res: Response) => {
    try {
        const profile_id = req.isUserHasProfile.profile_id;
        const { skill_name } = req.body;
        const text = `SELECT skill_id FROM skills WHERE skill_name = $1;`;
        const skill_data = await client.query(text, [skill_name]);

        let skill_id;

        if (skill_data.rowCount === 0) {
            const addQuery = `INSERT INTO skills(skill_name) VALUES ($1) RETURNING skill_id;`;
            const skill_data2 = await client.query(addQuery, [skill_name]);
            skill_id = skill_data2.rows[0].skill_id;
        } else {
            skill_id = skill_data.rows[0].skill_id;
        }

        // Check if the entry already exists in user_skills table
        const checkDuplicateQuery = `SELECT * FROM user_skills WHERE fk_user = $1 AND fk_skill_id = $2;`;
        const duplicateCheckResult = await client.query(checkDuplicateQuery, [profile_id, skill_id]);

        if (duplicateCheckResult.rowCount === 0) {
            const mapQuery = `INSERT INTO user_skills (fk_user, fk_skill_id) VALUES ($1, $2);`
            const values = [profile_id, skill_id];

            await client.query(mapQuery, values);
            res.status(200).json({ message: "Skill added successfully" });
        } else {
            res.status(400).json({ message: "Skill is already associated with this profile." });
        }
    } catch (err: any) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
};

exports.deleteSkill = async (req: ReqMid, res: Response) => {
    try {
        const profile_id = req.isUserHasProfile.profile_id;
        const { skill_name } = req.body;
        const text = `
            DELETE FROM user_skills
            WHERE fk_user = $1
              AND fk_skill_id IN (SELECT skill_id FROM skills WHERE skill_name = $2);
        `;
        const values = [profile_id, skill_name];
        //console.log(skill_name);
        const data = await client.query(text, values);

        res.status(200).send(`skill deleted from profile ${profile_id} for skill_name ${skill_name}`);
    } catch (err: any) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
};

exports.addUniversity = async (req: Request, res: Response) => {
    try {
        const { university_name } = req.body;
        if (!university_name) {
            return res.status(400).send("University name is missing");
        }
        const query = "SELECT university_id FROM university where university_name =$1";
        const params = [university_name];
        const university_data = await client.query(query, params);
        if (university_data.rowCount == 0) {
            const addQuery = "INSERT INTO university(university_name) values($1)";
            await client.query(addQuery, university_name);
            return res.status(200).send("university added successfully");
        }
        else {
            return res.status(200).send("university name already exist !")
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("internal server error")
    }
}
exports.getAllDomains = async (req: Response, res: Response) => {
    try {
        const query_1 = "SELECT *FROM domain";
        const query_2 = "SELECT *FROM skills";
        const query_3 = "SELECT *FROM university";
        const result_1 = await client.query(query_1);
        const result_2 = await client.query(query_2);
        const result_3 = await client.query(query_3);
        if (result_1.rowCount === 0 || result_2.rowCount === 0 || result_3.rowCount === 0) {
            return res.status(404).json({ error: "No data found" });
        }
        return res.status(200).json({
            domains: result_1.rows,
            skills: result_2.rows,
            universities: result_3.rows
        });
    } catch (error) {
        console.log(error)
        res.status(500).send("internal server error");
    }
}