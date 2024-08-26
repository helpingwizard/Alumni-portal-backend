import { Request, Response, query } from "express";
import { client } from "../model/db";
import { QueryResult } from "pg";
import { UserBody, ReqMid, GoogleUserData } from "../types/user";
import { timestamp } from "aws-sdk/clients/cloudfront";
const {
  addCompany,
  deleteCompany,
  addDomain,
  deleteDomain,
  addskills,
  deleteSkill,
  addUniversity,
  getAllDomains,
} = require("./domainController");

export interface skillObject {
  skill_id: Number;
  skill_name: String;
}

export interface companyObject {
  company_name: String;
  fk_company_id: Number;
  job_role: String;
  contribution: String;
  begin_date: number;
  last_date: number;
  user_company_id: string;
}

export const postFeedback = async (req: ReqMid, res: Response) => {
  const fk_user = req.isUserHasProfile.profile_id as number;
  const { content, stars } = req.body;

  try {
    const query =
      "INSERT INTO feedback (fk_user, content, stars) VALUES ($1, $2, $3)";
    const values = [fk_user, content, stars];
    await client.query(query, values);
    res.status(201).json({ message: "feedback submitted" });
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllProfiles = async (req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT * FROM user_profile");
    let user_profiles: any = [];
    for (let i = 0; i < response.rows.length; i++) {
      let uid = response.rows[i].fk_university_id;
      const query = `SELECT * FROM university WHERE university_id = ${uid}`;
      const responseRow = await client.query(query);
      const uniName = responseRow.rows[0].university_name;
      user_profiles.push({
        profile: response.rows[i],
        name: uniName,
      });
    }
    res.status(200).json(user_profiles);
  } catch (err: any) {
    res.status(401).send(err);
  }
};


exports.postUserProfiles = async (req: ReqMid, res: Response) => {
  try {
    const fk_user = req.user.user_id;
    // console.log("fk_user: ", fk_user)
    const {
      profile_image,
      about_me,
      git_profile,
      linkedin,
      user_resume,
      portfolio,
      instagram,
      suggestion,
      experience,
      domains,
      skills,
      universities,
      companies,
    } = req.body;

    let query =
      "INSERT INTO user_profile (fk_user, profile_image, about_me, instagram,  git_profile, linkedin, user_resume, portfolio, experience, suggestion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING profile_id, profile_image";

    const params = [
      fk_user,
      profile_image,
      about_me,
      instagram,
      git_profile,
      linkedin,
      user_resume,
      portfolio,
      experience,
      suggestion,
    ];
    const response = await client.query(query, params);
    
    const profile_id = response.rows[0].profile_id;

    //insert universities
    universities.forEach(async (uni: any) => {
      const { university, location, startYear, endYear, education } = uni;

      const checkUniversityQuery = `SELECT university_id FROM university WHERE university_name = $1;`;
      const universityData = await client.query(checkUniversityQuery, [
        university,
      ]);

      let university_id;
      if (universityData.rowCount === 0) {
        const addUniversityQuery = `INSERT INTO university (university_name) VALUES ($1) RETURNING university_id;`;
        const newUniversityData = await client.query(addUniversityQuery, [
          university,
        ]);
        university_id = newUniversityData.rows[0].university_id;
      } else {
        university_id = universityData.rows[0].university_id;
      }

      const checkUserUniversityQuery = `
        SELECT * FROM user_university
        WHERE fk_user = $1 AND fk_university_id = $2;
      `;
      const checkUserUniversityData = await client.query(
        checkUserUniversityQuery,
        [profile_id, university_id]
      );

      if (checkUserUniversityData.rows.length >= 1) {
        return res
          .status(409)
          .json({ error: "User already has this university" });
      }

      // Insert the relationship into the user_university table
      const addUserUniversityQuery = `
        INSERT INTO user_university (fk_university_id, fk_user, location, start_year, end_year, education)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;

      let values;
      if (endYear.length === 0) {
        values = [
          university_id,
          profile_id,
          location,
          new Date(startYear),
          null,
          education,
        ];
      } else {
        values = [
          university_id,
          profile_id,
          location,
          new Date(startYear),
          new Date(endYear),
          education,
        ];
      }

      await client.query(addUserUniversityQuery, values);
    });

    // Insert domains
    if (domains && domains.length != 0) {
      domains.forEach(async (domain: any) => {
        const domain_name = domain;
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
        const check = await client.query(
          "Select * from user_domain where fk_user = $1 and fk_domain_id = $2",
          [profile_id, domain_id]
        );
        if (check.rows.length >= 1) {
          return res
            .status(409)
            .json({ error: "User already have this domain" });
        }
        const mapQuery = `INSERT INTO user_domain (fk_user,fk_domain_id) VALUES($1,$2);`;
        const values = [profile_id, domain_id];

        const map_data = await client.query(mapQuery, values);
        // console.log(map_data)
      });
    }

    // Insert skills
    skills.forEach(async (skill: any) => {
      const skill_name = skill;
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
      const duplicateCheckResult = await client.query(checkDuplicateQuery, [
        profile_id,
        skill_id,
      ]);

      if (duplicateCheckResult.rowCount === 0) {
        const mapQuery = `INSERT INTO user_skills (fk_user, fk_skill_id) VALUES ($1, $2);`;
        const values = [profile_id, skill_id];

        await client.query(mapQuery, values);
      } else {
        res
          .status(400)
          .json({ message: "Skill is already associated with this profile." });
      }
    });

    // Insert companies
    if (companies.length > 0) {
      companies.forEach(async (company: any) => {
        const { company_name, job_role, contribution, begin_date, last_date } =
          company;
        const checkCompanyQuery = `SELECT company_id FROM companies WHERE company_name = $1;`;
        const companyData = await client.query(checkCompanyQuery, [company_name]);

        let company_id;
        if (companyData.rowCount === 0) {
          const addCompanyQuery = `INSERT INTO companies (company_name) VALUES ($1) RETURNING company_id;`;
          const newCompanyData = await client.query(addCompanyQuery, [
            company_name,
          ]);
          company_id = newCompanyData.rows[0].company_id;
        } else {
          company_id = companyData.rows[0].company_id;
        }

        const checkUserCompanyQuery = `
            SELECT * FROM user_companies
            WHERE fk_user = $1 AND fk_company_id = $2;
        `;
        const checkUserCompanyData = await client.query(checkUserCompanyQuery, [
          profile_id,
          company_id,
        ]);

        if (checkUserCompanyData.rows.length >= 1) {
          return res.status(409).json({ error: "User already has this company" });
        }

        // Insert the relationship into the user_companies table
        const addUserCompanyQuery = `
            INSERT INTO user_companies (fk_company_id, fk_user, job_role, contribution, begin_date, last_date)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;

        let values;
        if (last_date.length === 0) {
          values = [
            company_id,
            profile_id,
            job_role,
            contribution,
            begin_date,
            null,
          ];
        } else {
          values = [
            company_id,
            profile_id,
            job_role,
            contribution,
            begin_date,
            last_date,
          ];
        }

        await client.query(addUserCompanyQuery, values);
      });
    }

    res
      .status(200)
      .json({ message: "Profile Created", profile: response.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "Profile Not Created" });
  }
};

exports.isAlumniQuery = async( req: ReqMid, res: Response) => {
  const { user_id, is_alumni } = req.body;
  const is_alumniQuery = `UPDATE users SET is_alumni = $1 WHERE user_id = $2`;

  try {
    const result = await client.query(is_alumniQuery, [is_alumni, user_id]);
    if (result.rowCount != null && result.rowCount > 0) {
      res.status(200).json({ success: true, message: `User ${user_id} is now marked as an alumni.` });
    } else {
      res.status(404).json({ success: false, message: `User ${user_id} not found.` });
    }
  } catch (err) {
    console.error('Error updating alumni status:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}



interface domainObject {
  domain_id: Number;
  domain_name: String;
}

interface universityObject {
  university_id: number;
  user_university_id: number;
  university_name: string;
  location: string;
  start_year: number;
  end_year: number | null;
  education: string;
}

exports.getProfile = async (req: ReqMid, res: Response) => {
  try {
    const text =
      "SELECT up.*, u.username, u.first_name, u.last_name, u.email, u.passout_year, u.phone, u.is_alumni FROM user_profile up JOIN users u ON up.fk_user = u.user_id WHERE profile_id = $1;";
    const data = await client.query(text, [req.params.id]);

    if (data.rows.length <= 0) {
      return res.status(404).send({
        message: "User Not Found",
      });
    }

    const profile: any = data.rows[0];
    const user_id: number = data.rows[0].fk_user;

    const text3: string = `SELECT 
                            d.*, 
                            s.*, 
                            c.company_name, 
                            uc.*, 
                            u.*,
                            uu.*
                          FROM 
                            user_profile 
                          LEFT JOIN 
                            user_domain ud ON ud.fk_user = user_profile.profile_id 
                          LEFT JOIN 
                            domain d ON d.domain_id = ud.fk_domain_id 
                          LEFT JOIN 
                            user_skills us ON us.fk_user = user_profile.profile_id 
                          LEFT JOIN 
                            skills s ON s.skill_id = us.fk_skill_id 
                          LEFT JOIN 
                            user_companies uc ON uc.fk_user = user_profile.profile_id 
                          LEFT JOIN 
                            companies c ON c.company_id = uc.fk_company_id 
                          LEFT JOIN 
                            user_university uu ON uu.fk_user = user_profile.profile_id 
                          LEFT JOIN 
                            university u ON u.university_id = uu.fk_university_id 
                          WHERE 
                            user_profile.profile_id = $1`;
    const params = [req.params.id];
    const result = await client.query(text3, params);

    const domains: domainObject[] = [];
    const skills: skillObject[] = [];
    const companies: companyObject[] = [];
    const universities: universityObject[] = [];
    const domains_list: Number[] = [];
    const skills_list: Number[] = [];
    const companies_list: Number[] = [];
    const universities_list: Number[] = [];

    result.rows.forEach(async (row) => {
      // Extract unique domains
      if (row.domain_id && !domains_list.includes(row.domain_id)) {
        domains_list.push(row.domain_id);
        domains.push({
          domain_id: row.domain_id,
          domain_name: row.domain_name,
        });
      }

      // Extract unique skills
      if (row.skill_id && !skills_list.includes(row.skill_id)) {
        skills_list.push(row.skill_id);
        skills.push({ skill_id: row.skill_id, skill_name: row.skill_name });
      }

      // Extract unique companies
      if (row.company_name && !companies_list.includes(row.company_name)) {
        companies_list.push(row.company_name);
        companies.push({
          company_name: row.company_name,
          fk_company_id: row.fk_company_id,
          job_role: row.job_role,
          contribution: row.contribution,
          begin_date: row.begin_date,
          user_company_id: row.user_company_id,
          last_date: row.last_date,
        });
      }

      // Extract unique universities
      if (row.university_id && !universities_list.includes(row.university_id)) {
        universities_list.push(row.university_id);
        universities.push({
          university_id: row.university_id,
          user_university_id: row.user_university_id,
          university_name: row.university_name,
          location: row.location,
          start_year: row.start_year,
          end_year: row.end_year,
          education: row.education,
        });
      }
    });

    if (req.token) {
      const searcher_id = req.user.user_id;
      let text7: string = "SELECT * FROM user_profile WHERE fk_user = $1;";
      const param: number[] = [searcher_id];
      let profile_id = await client.query(text7, param);
      const searcher_profile = profile_id.rows[0].profile_id;
      text7 =
        "SELECT * FROM followers WHERE fk_follower_id = $1 AND fk_following_id = $2;";
      const data7: number[] = [searcher_profile, profile.profile_id];
      const follows = await client.query(text7, data7);
      let follows_variable = false;
      if (follows.rows.length > 0) {
        follows_variable = true;
      } else {
        follows_variable = false;
      }
      return res.status(200).json({
        profile,
        domains,
        skills,
        companies,
        universities,
        follows_variable,
      });
    }

    return res.status(200).json({
      profile,
      domains,
      skills,
      companies,
      universities,
    });
  } catch (err: any) {
    return res.send(err);
  }
};

exports.updateProfiles = async (req: ReqMid, res: Response) => {
  const fk_user = req.user.user_id;
  const profileId = req.isUserHasProfile.profile_id;

  try {
    // console.log("fk_user: ", fk_user)
    const {
      
      profile_image,
      about_me,
      git_profile,
      linkedin,
      user_resume,
      portfolio,
      instagram,
      experience,
      suggestion,
      skills,
      universities,
      companies,
    } = req.body;

    let query = `
    UPDATE 
      user_profile
    SET
        fk_user = $1,
        profile_image = $2,
        about_me = $3,
        instagram = $4,
        git_profile = $5,
        linkedin = $6,
        user_resume = $7,
        portfolio = $8,
        experience = $9,
        suggestion = $10
    WHERE
        profile_id = $11`;

    const params = [
      fk_user,
      profile_image,
      about_me,
      instagram,
      git_profile,
      linkedin,
      user_resume,
      portfolio,
      experience,
      suggestion,
      profileId,
    ];
    const response = await client.query(query, params);

    const profile_id = profileId;

    //Update universities
    if (universities?.length > 0) {
      universities.forEach(async (uni: any) => {
        const {
          user_university_id,
          university,
          location,
          startYear,
          endYear,
          education,
        } = uni;

        const updateQuery = `UPDATE user_university SET location = $1, start_year = $2, end_year = $3, education = $4 WHERE fk_user = $5 AND user_university_id = $6 RETURNING fk_university_id`;
        let updateParam;
        if (endYear.length === 0) {
          updateParam = [
            location,
            startYear,
            null,
            education,
            profile_id,
            user_university_id,
          ];
        } else {
          updateParam = [
            location,
            startYear,
            endYear,
            education,
            profile_id,
            user_university_id,
          ];
        }
        const updateResult = await client.query(updateQuery, updateParam);

        const universityId = updateResult.rows[0].fk_university_id;

        const updateUniversityQuery = `UPDATE university SET university_name = $1 WHERE university_id = $2`;
        const updateUniversityParams = [university, universityId];
        await client.query(updateUniversityQuery, updateUniversityParams);
      });
    }
    if (companies?.length > 0) {    // Update companies
      companies.forEach(async (company: any) => {
        const {
          user_company_id,
          company_name,
          job_role,
          contribution,
          begin_date,
          last_date,
        } = company;

        let companyId;

        if (user_company_id) {
          // Check if the company exists
          const checkQuery = `SELECT fk_company_id FROM user_companies WHERE fk_user = $1 AND user_company_id = $2`;
          const checkParams = [profile_id, user_company_id];
          const checkResult = await client.query(checkQuery, checkParams);

          if (checkResult.rows.length > 0) {
            // Company exists, perform update
            const updateQuery = `UPDATE user_companies SET job_role = $1, contribution = $2, begin_date = $3, last_date = $4 WHERE fk_user = $5 AND user_company_id = $6 RETURNING fk_company_id`;
            const updateParams = last_date.length === 0 ?
              [job_role, contribution, begin_date, null, profile_id, user_company_id] :
              [job_role, contribution, begin_date, last_date, profile_id, user_company_id];

            const updateResult = await client.query(updateQuery, updateParams);
            companyId = updateResult.rows[0].fk_company_id;
          } else {
            // If `user_company_id` exists but no matching record, treat it as a new entry
            companyId = null;
          }
        }

        if (!companyId) {
          // Insert new company record if it doesn't exist
          const insertQuery = `INSERT INTO companies (company_name) VALUES ($1) RETURNING company_id`;
          const insertParams = [company_name];
          const insertResult = await client.query(insertQuery, insertParams);
          companyId = insertResult.rows[0].company_id;

          const insertUserCompanyQuery = `
          INSERT INTO user_companies (fk_user, fk_company_id, job_role, contribution, begin_date, last_date)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_company_id
        `;
          const insertUserCompanyParams = last_date.length === 0 ?
            [profile_id, companyId, job_role, contribution, begin_date, null] :
            [profile_id, companyId, job_role, contribution, begin_date, last_date];

          const insertUserCompanyResult = await client.query(insertUserCompanyQuery, insertUserCompanyParams);
          // user_company_id = insertUserCompanyResult.rows[0].user_company_id;
        } else {
          // Update company name in `companies` table if updating existing record
          const updateCompanyQuery = `UPDATE companies SET company_name = $1 WHERE company_id = $2`;
          const updateCompanyParams = [company_name, companyId];
          await client.query(updateCompanyQuery, updateCompanyParams);
        }
      });
    }

    // Update skills
    // skills.forEach(async (skill: any) => {
    //   const skill_name = skill;

    //   const selectQuery = `SELECT fk_skill_id FROM user_skills WHERE fk_user = $1`;
    //   const selectParam = [profileId];
    //   const selectResult = await client.query(selectQuery, selectParam);

    //   const skill_id = selectResult.rows[0].fk_skill_id;

    //   console.log("This is skill id : ", skill_id);

    //   const updateQuery = `UPDATE skills SET skill_name = $1 WHERE skill_id = $2`;
    //   console.log("this is skill names: ",skill_name);
    //   const updateParam = [skill_name, skill_id];
    //   const r = await client.query(updateQuery, updateParam);

    //   console.log("This is rrrrr: ", r);
    // });

    res
      .status(200)
      .json({ status: true, message: "Profile updated successfully" });
  } catch (error) {
    console.log("Errororrro: ", error);
    res.status(401).json({ status: false, message: "Profile Not Created" });
  }
};

exports.deleteProfiles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleteProfile: any = await client.query(
      "DELETE FROM user_profile WHERE profile_id = $1",
      [id]
    );
    res.status(200).json({ message: "User deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "User deleted successfully!" });
  }
};

exports.follow_unfollow = async (req: Request, res: Response) => {
  try {
    const { action, profile_id } = req.body;
    const friend_id = req.params.id;
    if (action) {
      const text: string = "insert into followers values($1,$2)";
      let params = [profile_id, friend_id];
      let result = await client.query(text, params);
      result = await client.query(
        "update user_profile set followers = followers + 1 where profile_id = $1",
        [friend_id]
      );
      res
        .status(200)
        .json({ message: `${profile_id} has now followed ${friend_id}` });
    } else {
      const text: string =
        "delete from followers where fk_follower_id = $1 AND fk_following_id = $2";
      let params = [profile_id, friend_id];
      let result = await client.query(text, params);
      result = await client.query(
        "update user_profile set followers = followers - 1 where profile_id = $1",
        [friend_id]
      );
      res
        .status(200)
        .json({ message: `${profile_id} has now unfollowed ${friend_id}` });
    }
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const updateProfileImage = async (req: ReqMid, res: any) => {

  const { profile_image } = req.body;

  try {
    const profileId = req.isUserHasProfile.profile_id;

    const query = `UPDATE user_profile SET profile_image = $1 WHERE profile_id = $2`;
    const params = [profile_image, profileId];
    await client.query(query, params);

    res.status(200).json({ status: true, message: "User profile image added successfully" });

  } catch (err: any) {
    console.log(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

export const updateProfileBanner = async (req: ReqMid, res: any) => {

  const { profile_background_image } = req.body;

  try {
    const profileId = req.isUserHasProfile.profile_id;

    const query = `UPDATE user_profile SET profile_background_image = $1 WHERE profile_id = $2`;
    const params = [profile_background_image, profileId];
    await client.query(query, params);

    res.status(200).json({ status: true, message: "User profile banner image added successfully" });

  } catch (err: any) {
    console.log(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
