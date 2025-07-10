import { join } from "path";

export const JsonTempDirName = "swagger-json-temp";

export function getSchemaPath(fileName: string) {
  return join(process.cwd(), `./${JsonTempDirName}/${fileName}.json`);
}
