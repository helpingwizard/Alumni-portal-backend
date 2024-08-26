import { client } from "../model/db";

exports.filterPost = async (req: any, res: any) => {
  let domainStr = req.body.domain + "";
  domainStr = domainStr.replace("[", "(");
  domainStr = domainStr.replace("]", ")");
  const response = await client.query(
    "SELECT * FROM posts as pst INNER JOIN users as u ON pst.fk_user = u.user_id INNER JOIN user_profile as up ON pst.fk_user = up.fk_user WHERE fk_domain_id IN " +
      domainStr
  );
  res.send(response.rows);
};

exports.filterProfile = async (req: any, res: any) => {
  // get domain,name,skill from query parameter ,university,companyName
  let { domain_id, company_id, university_id } = req.body;
  const response = await client.query(
    `SELECT * FROM users u INNER JOIN user_profile up ON u.user_id = up.fk_user 
    INNER JOIN university uv ON up.fk_university_id = uv.university_id
    INNER JOIN user_companies uc ON u.user_id = uc.fk_user
    INNER JOIN companies c ON uc.fk_companies_id = c.companies_id
    INNER JOIN user_domain ud ON ud.fk_user = u.user_id
    INNER JOIN domain d ON d.domain_id = ud.fk_domain_id
    WHERE u.user_id != -1
    AND uv.university_id ${university_id ? "= " + university_id : "!= -1"}
    AND d.domain_id ${domain_id ? "= " + domain_id : "!= -1"}
    AND uc.fk_companies_id ${company_id ? "= " + company_id : "!= -1"};`
  );
  res.send(response.rows);
};
