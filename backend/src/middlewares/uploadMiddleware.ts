import multer from 'multer';

// Use memory storage to allow routing dynamically to Cloudinary or Local Disk in controllers
const storage = multer.memoryStorage();

// File limits & validation filters
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common formats: Images, Videos, PDFs, text, zip, docs, worksheets
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/json',
    'application/zip', 'application/x-zip-compressed'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File format '${file.mimetype}' is not supported.`) as any, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // Limit files to 100MB (large enough for media uploads)
  }
});

export default upload;
