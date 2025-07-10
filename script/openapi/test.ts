import { resolve } from "path";
import { generateService } from "@umijs/openapi";
import { swaggerJsonUrl } from "./config";
import { customFunctionName, getSchemaPath, writeSwaggerJsonToLocalFile } from "./utils";

export async function generateService_test() {
  const projectName = "test";

  const fileName = `__swagger_${projectName}`;
  await writeSwaggerJsonToLocalFile(`${swaggerJsonUrl.test}/v2/api-docs`, fileName, {
    includeTags: ["xxx"]
  });
  generateService({
    requestLibPath: "import { request } from '/@/utils/http/test'",
    schemaPath: getSchemaPath(fileName),
    serversPath: "./src/api",
    projectName,
    namespace: "APITest",
    templatesFolder: resolve(process.cwd(), "./script/openapi/templates"),
    hook: {
      // 自定义函数名, 因为后端都没有定义 operationId
      customFunctionName: data => customFunctionName(data, { spliceLength: 3 })
    }
  });
}
