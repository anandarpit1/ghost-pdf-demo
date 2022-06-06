const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const multer = require("multer");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 7025;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const pdfFilter = function (req, file, callback) {
  var ext = path.extname(file.originalname);
  if (ext !== ".pdf") {
    return callback("This Extension is not supported");
  }
  callback(null, true);
};

const upload = multer({
  storage: storage,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // 5MB
  // },
  fileFilter: pdfFilter,
});

var pdfUpload = upload.single("file");

app.post("/compress", (req, res) => {
  pdfUpload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file");
    } else {
      var inputFile = req.file.path;

      const inputName = req.file.filename;
      const deduct = path.extname(inputName).toString();

      const outputFile =
        inputName.substr(0, inputName.length - deduct.length) +
        "." +
        "output" +
        ".pdf";
      const outputFilePath = __dirname + "/output/" + outputFile;

      exec(
        `gs \ -q -dNOPAUSE -dBATCH -dSAFER \ -sDEVICE=pdfwrite \ -dCompatibilityLevel=1.5  \ -dEmbedAllFonts=false \ -dSubsetFonts=true \ -dOptimize=true \
        -dDownsampleColorImages=true \ -dDownsampleGrayImages=true \ -dDownsampleMonoImages=true \ -dAutoRotatePages=/None \ -dCompressFonts=true \ -dColorImageDownsampleType=/Bicubic \ -dColorImageResolution=50 \ -dGrayImageDownsampleType=/Bicubic \ -dGrayImageResolution=40 \ -dMonoImageDownsampleType=/Bicubic \ -dMonoImageResolution=40 \ -sOutputFile="output/${outputFile}" \ ${inputFile}`,
        (err, stdout, stderr) => {
          if (err) {
            return res.json({
              error: err.message,
            });
          } else {
            return res.sendFile(outputFilePath);
          }
        }
      );
    }
  });
});

app.listen(PORT, () => {
  console.log(`App is listening on Port ${PORT}`);
});
