import axios from "axios";
exports.sendOtpMail = async (name:string, email:string, otp:number) => {
    try {
      const options = {
        method: "POST",
        url: `${process.env.MAILING_API}/forgot/`,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          name,
          mail_id: email,
          otp,
        },
      };
      const res = await axios(options);
      console.log("send otp", res.data);
    } catch (e) {
      console.log(e);
    }
  };