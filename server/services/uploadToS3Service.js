import AWS from 'aws-sdk';

class UploadToS3Service {

    uploadCsvToS3(fileName) {
        AWS.config.update({
            accessKeyId: 'AKIA2ORJ3LC3OHQJIK7I',
            secretAccessKey: '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',
            region: 'eu-central-1'
        });

        const s3 = new AWS.S3();

        // Read the CSV file
        const fileContent = fs.readFileSync(`../datasets/${fileName}.csv`);

        // Set the parameters for S3 bucket and file upload
        const params = {
            Bucket: 'adb-satellite-project',
            Key: `/${fileName}.csv`,
            Body: fileContent
        };

        // Upload the file to S3
        s3.upload(params, (err, data) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`File ${fileName} uploaded successfully.`, data.Location);
            }
        });
    }

}

export default UploadToS3Service;
