import aws from 'aws-sdk'
import crypto from 'crypto'
import { promisify } from 'util'
import {Request, Response} from 'express'
const randomBytes = promisify(crypto.randomBytes);

const bucketName = process.env.bucketName
const region = process.env.region
const accessKeyId = process.env.accessKeyId
const secretAccessKey = process.env.secretAccessKey

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey
})

export async function generateUploadURL() {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString('hex');
  

  const params = ({
    Bucket: bucketName,
    Key: imageName,
    Expires: 60
  })
  

  const uploadURL = await s3.getSignedUrlPromise('putObject', params);

  console.log("s3 se: ",uploadURL);
  
  return uploadURL;
}

export const generateURL = async (req: Request, res: Response) => {
  const url = await generateUploadURL();
  res.send({url})
}


