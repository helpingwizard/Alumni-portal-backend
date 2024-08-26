import express, { Request, Response, query } from "express";
import { client } from "../model/db";
import { ReqMid } from "../types/user";
import { link } from "fs";
import { profile } from "console";

//get all works
const GetAllWorks = async (req: Request, res: Response) => {
  try {
    const getQuery = `SELECT w.work_id,
        up.profile_id,
        up.profile_image,
        w.fk_user_id,
        u.first_name,
        u.last_name,
        w.work_type,
        w.company_name,
        w.job_role,
        w.address_,
        w.requirements,
        w.tag,
        w.link_to_apply,
        w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        order by posted_at desc;`;
    const result = await client.query(getQuery);
    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//add work
const AddWork = async (req: ReqMid, res: Response) => {
  try {
    const profile_id = req.isUserHasProfile.profile_id;

    const getfk_userQuery =
      "SELECT fk_user FROM user_profile WHERE profile_id = $1";
    const result = await client.query(getfk_userQuery, [profile_id]);
    const fk_user: number = result.rows[0].fk_user;

    const checkIfAlumniQuery = `SELECT is_alumni, is_verified FROM users WHERE users.user_id = $1;`;
    const user_id = [fk_user];
    const checkIfAlumni = await client.query(checkIfAlumniQuery, user_id);

    if (
      checkIfAlumni.rows[0].is_alumni === false ||
      checkIfAlumni.rows[0].is_verified === false
    ) {
      return res.status(403).json({ message: "Only verified alumni can post" });
    }

    const {
      work_type,
      company_name,
      job_role,
      address,
      requirements,
      tag,
      link_to_apply,
    } = req.body;

    if (
      !profile_id ||
      !company_name ||
      !job_role ||
      !address ||
      !requirements ||
      !link_to_apply ||
      !tag ||
      !work_type
    ) {
      return res.status(400).json({ message: "Please fill all the fields!" });
    }

    if (
      profile_id &&
      company_name &&
      job_role &&
      requirements &&
      link_to_apply &&
      address &&
      tag &&
      work_type
    ) {
      // const durationInSeconds = duration / 1000; // Convert duration from milliseconds to seconds
      // const stipendValue = parseFloat(stipend); // Ensure stipend is parsed as a float

      const PostQuery = `
                INSERT INTO work
                (work_type,fk_user_id, company_name, job_role,address_, requirements, tag, link_to_apply, posted_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8,to_timestamp($9));`;

      const params = [
        work_type,
        profile_id,
        company_name,
        job_role, // Use duration in seconds
        address,
        requirements, // Use parsed stipend value
        tag,
        link_to_apply,
        Date.now() / 1000, // Convert milliseconds to seconds for timestamp
      ];

      await client.query(PostQuery, params);
      res.status(200).json({ message: " Work Added Successfully!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in adding Work !!" });
  }
};

//get work by profile
const getWorksByProfile = async (req: ReqMid, res: Response) => {
  try {
    const profile_id = req.isUserHasProfile.profile_id;
    //console.log(profile_id);
    const query = `        
    SELECT 
        w.*,
        up.profile_id,
        up.profile_image,
        u.first_name,
        u.last_name
    FROM 
        work w
    JOIN 
        user_profile up ON w.fk_user_id = up.profile_id
    JOIN 
        users u ON up.fk_user = u.user_id
    WHERE 
        w.fk_user_id = $1;`;
    const result = await client.query(query, [profile_id]);
    return res.status(200).json({status: true, data: result.rows, message: "Work posts of authenticated alumni fetched"});
  } catch (error) {
    console.error("Error fetching works:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//delete work
const DeleteWork = async (req: Request, res: Response) => {
  try {
    const work_id = req.params.work_id;
    if (!work_id) {
      return res.status(400).json({ message: "work id not found !" });
    }
    //changes have ahet
    if (work_id) {
      const DeleteQuery = `DELETE FROM work WHERE work_id=$1`;
      const params = [work_id];
      await client.query(DeleteQuery, params);
      res.status(200).json({ message: "Deleted Successfully !!" });
    } else {
      res.status(400).json({ status: false, message: "Not Deleted !" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error in deleting internship !!" });
  }
};

const GetAllInternships = async (req: Request, res: Response) => {
  try {
    const getQuery = `
        SELECT w.work_id,
               up.profile_id,
               up.profile_image,
               u.first_name,
               u.last_name,
               w.work_type,
               w.company_name,
               w.job_role,
               w.tag,
               w.address_,
               w.requirements,
               w.link_to_apply,
               w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        WHERE w.work_type='Internship' -- Assuming the tag column is named "tag"
        ORDER BY w.posted_at DESC;
    `;
    const result = await client.query(getQuery);
    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const GetAllJobs = async (req: Request, res: Response) => {
  try {
    const getQuery = `
        SELECT w.work_id,
               up.profile_id,
               up.profile_image,
               u.first_name,
               u.last_name,
               w.work_type,
               w.company_name,
               w.job_role,
               w.tag,
               w.address_,
               w.requirements,
               w.link_to_apply,
               w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        WHERE w.work_type='Fulltime' -- Assuming the tag column is named "tag"
        ORDER BY w.posted_at DESC;
    `;
    const result = await client.query(getQuery);
    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const JobFilter = async (req: Request, res: Response) => {
  const tags: string = req.query.tags as string;
  try {
    if (tags) {
      const tagsArray: string[] = tags.split(",");
      //console.log(tagsArray)
      const getQuery: string = `
            SELECT w.work_id,
                   up.profile_id,
                   up.profile_image,
                   u.first_name,
                   u.last_name,
                   w.work_type,
                   w.company_name,
                   w.job_role,
                   w.tag,
                   w.address_,
                   w.requirements,
                   w.link_to_apply,
                   w.posted_at
            FROM work w
            JOIN user_profile up ON w.fk_user_id = up.profile_id
            JOIN users u ON up.fk_user = u.user_id
            WHERE w.work_type='Fulltime' and w.tag && $1 -- Assuming the tag column is named "tag"
            ORDER BY w.posted_at DESC;
        `;
      const result = await client.query(getQuery, [tagsArray]);
      if (result.rowCount === 0) {
        return res.status(400).json({ message: "Not found" });
      }
      return res.status(200).json(result.rows);
    } else {
      const getQuery = `
        SELECT w.work_id,
               up.profile_id,
               up.profile_image,
               u.first_name,
               u.last_name,
               w.work_type,
               w.company_name,
               w.job_role,
               w.tag,
               w.address_,
               w.requirements,
               w.link_to_apply,
               w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        WHERE w.work_type='Fulltime' -- Assuming the tag column is named "tag"
        ORDER BY w.posted_at DESC;
    `;
      const result = await client.query(getQuery);
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const InternshipFilter = async (req: Request, res: Response) => {
  const tags: string = req.query.tags as string;
  try {
    if (tags) {
      const tagsArray: string[] = tags.split(",");
      //console.log(tagsArray)
      const getQuery: string = `
            SELECT w.work_id,
                   up.profile_id,
                   up.profile_image,
                   u.first_name,
                   u.last_name,
                   w.work_type,
                   w.company_name,
                   w.job_role,
                   w.tag,
                   w.address_,
                   w.requirements,
                   w.link_to_apply,
                   w.posted_at
            FROM work w
            JOIN user_profile up ON w.fk_user_id = up.profile_id
            JOIN users u ON up.fk_user = u.user_id
            WHERE w.work_type='Internship' and w.tag && $1 -- Assuming the tag column is named "tag"
            ORDER BY w.posted_at DESC;
        `;
      const result = await client.query(getQuery, [tagsArray]);
      if (result.rowCount === 0) {
        return res.status(400).json({ message: "Not found" });
      }
      return res.status(200).json(result.rows);
    } else {
      const getQuery = `
        SELECT w.work_id,
               up.profile_id,
               up.profile_image,
               u.first_name,
               u.last_name,
               w.work_type,
               w.company_name,
               w.job_role,
               w.tag,
               w.address_,
               w.requirements,
               w.link_to_apply,
               w.posted_at
        FROM work w
        JOIN user_profile up ON w.fk_user_id = up.profile_id
        JOIN users u ON up.fk_user = u.user_id
        WHERE w.work_type='Internship' -- Assuming the tag column is named "tag"
        ORDER BY w.posted_at DESC;
    `;
      const result = await client.query(getQuery);
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const GetAllInternshipByProfileId = async (req: ReqMid, res: any) => {
  const profileId = req.params.profileId;
  try {
    const query = `        
    SELECT 
        w.*,
        up.profile_id,
        up.profile_image,
        u.first_name,
        u.last_name
    FROM 
        work w
    JOIN 
        user_profile up ON w.fk_user_id = up.profile_id
    JOIN 
        users u ON up.fk_user = u.user_id
    WHERE 
        w.fk_user_id = $1;`;
    const result = await client.query(query, [profileId]);
    // console.log(result.rows);
    res.status(200).json({
      status: true,
      data: result.rows,
      message: `Retrived all internship posts with profile id`,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

module.exports = {
  GetAllWorks,
  AddWork,
  getWorksByProfile,
  DeleteWork,
  GetAllInternships,
  GetAllJobs,
  JobFilter,
  InternshipFilter,
  GetAllInternshipByProfileId,
};
