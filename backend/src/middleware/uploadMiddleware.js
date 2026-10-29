import multer from 'multer';
const storage = multer.memoryStorage();
const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const fileFilter = (req, file, callback) => {
  if (allowedTypes.includes(file.mimetype)) return callback(null, true);
  const error = new Error('Resume must be a PDF, DOC, or DOCX file');
  error.statusCode = 400;
  callback(error);
};
export const uploadResume = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('resume');
