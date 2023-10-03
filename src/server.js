const express = require('express');
const contentType = require('content-type');
const {writeFile} = require('fs');
const getRawBody = require('raw-body');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Define where to store uploaded files
const storage = multer.memoryStorage();

// Create a multer instance with the storage configuration
const upload = multer({
  storage: storage,
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

const testMessage = 'Hi! The server is listening on port 8080.';

const port = 8080;

const delay = t => new Promise(res => setTimeout(() => res(), t));

const uploadFile = (fileName, fileBuffer, method = 'post', req, res) => {
  const fileExtension = fileName.split('.').pop();

  const savePath = path.resolve(
    __dirname,
    '..',
    `tmp/raw/${method}RequestFile.${fileExtension}`,
  );
  console.log(`Writing to: ${savePath}`);

  writeFile(savePath, fileBuffer, 'binary', function (err) {
    if (err) {
      console.log('Write error:', err);
      res.status = 500;
    } else {
      console.log('Wrote file.');
      console.log(`Message from Params: ${req.body?.message}`);
      res.status = 202;
    }
    res.end();
  });
};

app.post('/uploadFail', async (_, response) => {
  console.log('uploadFail');
  await delay(5000);
  response.status(502).end();
});

app.get('/', function (req, res) {
  res.send(testMessage);
});

app.post('/upload', upload.single('file'), function (req, res, next) {
  console.log('/upload post');
  uploadFile(req.file.originalname, req.file.buffer, 'post', req, res);
});

app.put('/upload/:file_name', function (req, res, next) {
  console.log('/upload put');
  const fileName = req.params.file_name;
  getRawBody(
    req,
    {
      length: req.headers['content-length'],
      limit: '100mb',
      encoding: contentType.parse(req).parameters.charset,
    },
    function (err, string) {
      if (err) return next(err);
      uploadFile(fileName, string, 'put', req, res);
    },
  );
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
