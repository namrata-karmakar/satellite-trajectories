import AWS from 'aws-sdk';
import fs from 'fs';

class UploadToS3Service {

    async uploadCsvToS3(fileName) {
        let response, status;

        AWS.config.update({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: 'eu-central-1'
        });

        // Read the CSV file
        const fileContent = fs.readFileSync(`datasets/${fileName}.csv`, { encoding: "utf8" });

        // Set the parameters for S3 bucket and file upload
        const params = {
            Bucket: 'adb-satellite-project',
            Key: `${fileName}.csv`,
            Body: fileContent
        };

        try {
            const s3 = new AWS.S3();

            // Upload the file to S3
            s3.upload(params, (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`File ${fileName} uploaded successfully.`, data.Location);
                }
            });
        } catch (error) {
            response = error.message;
            status = 500;
            throw error;
        }
    }

}

export default UploadToS3Service;
