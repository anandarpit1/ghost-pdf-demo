const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const multer = require("multer");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

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
      console.log(inputFile)

      const inputName = req.file.filename;
      const deduct = path.extname(inputName).toString();

      const outputFile =
        inputName.substr(0, inputName.length - deduct.length) +
        "." 
        "output" +
        ".pdf";
      const outputFilePath = __dirname + "/output/" + outputFile;

      //Using Ghostscript
      exec(
        `gs \ -q -dNOPAUSE -dBATCH -dSAFER -dQUIET \ -sDEVICE=pdfwrite \ -dCompatibilityLevel=1.5  \ -dEmbedAllFonts=false \ -dSubsetFonts=false \ -dOptimize=true \ -dDownsampleColorImages=true \ -dDownsampleGrayImages=true \ -dDownsampleMonoImages=true \  -dAutoRotatePages=/None \ -dDetectDuplicateImages=true \ -dCompressFonts=true \ -r10 \ -dCompressFonts \ -dColorImageDownsampleType=/Subsample \ -dColorImageResolution=50 \ -dGrayImageDownsampleType=/Subsample \ -dGrayImageResolution=40 \   -dMonoImageDownsampleType=/Subsample \ -dMonoImageResolution=40 \ -dCompressEntireFile=true\ -sOutputFile="output/${outputFile}" \ ${inputFile}`,
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

      //Using PDF TK
      // exec(
      //   `pdftk ${inputFile} output "output/${outputFile}" compress `,
      //   (err, stdout, stderr) => {
      //     if (err) {
      //       return res.json({
      //         error: err.message,
      //       });
      //     } else {
      //       return res.sendFile(outputFilePath);
      //     }
      //   }
      // );
    }
  });
});


app.post("/pdftoppt", (req, res) => {
  pdfUpload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file");
    } else {
      var inputFile = req.file.path;
      console.log(inputFile)

      const inputName = req.file.filename;
      const deduct = path.extname(inputName).toString();

      const outputFile =
        inputName.substr(0, inputName.length - deduct.length) +
        "." +
        "output" +
        ".pdf";
      const outputFilePath = __dirname + "/output/" + outputFile;

      //Using Libre office
      exec(
          `soffice --infilter=impress_pdf_import --convert-to ppt ${inputFile} --outdir "output/${outputFile}"`,
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
