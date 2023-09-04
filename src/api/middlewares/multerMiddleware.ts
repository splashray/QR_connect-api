import multer from "multer";
import * as os from "os";

// Files will be stored in temporary directory e.g /tmp on linux
const upload = multer({ dest: os.tmpdir() });

export = upload;
