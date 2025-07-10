import { dirname } from "path";
import axios from "axios";
import fs from "fs-extra";

import { type ParseOptions, parseJSONFile } from "./parseJSONFile";
import { getSchemaPath } from "./getSchemaPath";

/**
 * 获取 swagger scheme 并写到本地文件
 */
export async function writeSwaggerJsonToLocalFile(url: string, fileName: string, parseOptions?: ParseOptions) {
  try {
    let { data } = await axios.get(url);

    const filePath = getSchemaPath(fileName);

    await fs.ensureDir(dirname(filePath));

    data = parseJSONFile(data, parseOptions);
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch (err) {
    console.error(err);
  }
}
