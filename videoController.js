import fs from "fs";
const videoController = (req, res) => {
  const filename = req.params.filename;
  const videoPath = `./videos/${filename}`;
  const range = req.headers.range;

  if (!fs.existsSync(videoPath)) return res.status(404).send("Video not found");

  const fileSize = fs.statSync(videoPath).size;
  if (!range) {
    return res.status(400).send("range empty");
  }

  const temp = range.replace("bytes=", "").split("-");
  const start = Number(temp[0]);

  let end;
  if (temp[1]) end = Number(temp[1]);
  else end = Math.min(start + 10 ** 6, fileSize - 1);
  const contentLength = end - start + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  });

  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
};

export default videoController;

